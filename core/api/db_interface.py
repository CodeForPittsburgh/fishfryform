"""
Functions that talk to Dynamo DB
"""

import json
import decimal
import geojson
import uuid
import logging
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from marshmallow import ValidationError

from .. import dynamo_db
from ..models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, FishFryFeatureCollection, Geometry

# reference to the table
fishfry_table = dynamo_db.tables['FishFryDB']


def decimal_decoder(json_obj):
    """convert any floats in a dictionary (loaded from a json) to Decimal type.
    This is required in order to load data to DynamoDB.
    """
    return json.loads(json.dumps(json_obj), parse_float=decimal.Decimal)


class DecimalEncoder(json.JSONEncoder):
    """use to convert any DynamoDB items stored as Decimal objects to numbers.
    """

    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)


def replace_emptry_strings(a_dict):
    """use to convert empty strings to None values; DynamoDB doesn't like
    empty strings
    """
    for k, v in a_dict.items():
        if not isinstance(v, dict):
            if v == "":
                a_dict[k] = None
        else:
            replace_emptry_strings(v)


def get_all_fishfries(published=None, validated=None, has_geom=True):
    """get all fish fries as a GeoJSON Feature Collection. Filter records based on 
    validation and publication status.

    Keyword Arguments:
        published {[type]} -- [description] (default: {None})
        validated {[type]} -- [description] (default: {None})

    Returns:
        [type] -- a GeoJSON Feature Collection
    """

    # this effectively returns  the "features" array of a GeoJSON Feature Collection
    response = fishfry_table.scan()
    if response['Count'] > 0:
        # list of features
        features = response["Items"]
        # handle the "published" parameter
        if published is not None:
            if published is False:
                features = (
                    [x for x in features if not x['properties']['publish']])
            else:  # published == False:
                features = (
                    [x for x in features if x['properties']['publish']])
        # handle the "validated" parameter
        if validated is not None:
            if validated is False:
                features = (
                    [x for x in features if not x['properties']['validated']])
            else:  # validated == False:
                features = (
                    [x for x in features if x['properties']['validated']])
            # logging.info(len(features))
        # we can't return features without geometries if we want to map them!
        if has_geom:
            logging.info("checking geom")
            for feature in features:
                validation = Geometry().load(feature)
                if validation.errors:
                    logging.info(feature['id'])
                if not isinstance(feature['geometry'], dict):
                    logging.info(feature['id'], feature['geometry'])
            features = [x for x in features if isinstance(x['geometry'], dict)]

        # build a feature collection (as a dict
        feature_collection_geojson = geojson.FeatureCollection(features)

        # pass dictionary through json parser to process Decimal types
        result = json.loads(
            json.dumps(feature_collection_geojson, cls=DecimalEncoder)
        )

        # use marshmallow validation on results to highlight potential fixes required.
        # try:
        #     valid, errors = FishFryFeatureCollection().load(feature_collection_geojson)
        #     logging.info(errors)
        # except ValidationError as err:
        #     logging.info(err)

        return result
    else:
        return response
    return None


def get_one_fishfry(ffid):
    """get a single fish fry record from the database as a GeoJSON Feature

    Arguments:
        ffid {[type]} -- [description]

    Returns:
        [type] -- [description]
    """

    response = fishfry_table.query(
        KeyConditionExpression=Key('id').eq("""{0}""".format(ffid))
    )

    if response['Count'] > 0:
        # get the first item, handling the Decimal objects within
        feature = json.loads(
            json.dumps(response['Items'][0], cls=DecimalEncoder)
        )
        return feature
    else:
        return response


def make_one_fishfry(properties, geometry, strict=False, return_copy=True):
    """adds a new fish fry to the database; then retrieves it and 
    returns the result

    Arguments:
        properties {[type]} -- [description]

    Keyword Arguments:
        geometry {[type]} -- [description] (default: {None})
        lat {[type]} -- [description] (default: {None})
        lon {[type]} -- [description] (default: {None})
        strict {[type]} -- [description] (default: {True})

    Returns:
        [type] -- [description]
    """

    if not (properties and geometry):
        return {'Error': 'Submitted json is not valid'}
    else:
        if strict:
            # Run the args through the marshmallow schema
            data, errors = FishFryProperties().load(properties)
            # If errors, return those
            if errors:
                return errors
        # new id
        ffid = str(uuid.uuid4())
        # logging.info("new feature", ffid)
        feature = {
            'id': ffid,
            'type': "Feature"
        }
        # convert decimal objects to floats
        feature['properties'] = decimal_decoder(properties)
        feature['geometry'] = decimal_decoder(geometry)
        replace_emptry_strings(feature['properties'])
        # create new records
        response = fishfry_table.put_item(
            Item=feature
        )
        if return_copy:
            return get_one_fishfry(ffid)
        else:
            return ffid


def update_one_fishfry(ffid, properties, geometry, strict=False, return_copy=True):
    """updates a fish fry in the databse. Then retrieves that record and returns it.

    Arguments:
        ffid {[type]} -- [description]

    Keyword Arguments:
        properties {[type]} -- [description] (default: {None})
        geometry {[type]} -- [description] (default: {None})
        lat {[type]} -- [description] (default: {None})
        lon {[type]} -- [description] (default: {None})
        strict {[type]} -- [description] (default: {True})

    Returns:
        [type] -- [description]
    """

    if not (properties and geometry):
        return {'Error': 'No data was submitted for update.'}
    else:
        if strict:
            # Run the args through the marshmallow schema
            data, errors = FishFryProperties().load(properties)
            # If errors for keys included in the properties, return those
            # if errors for keys that weren't actually submitted (because they're
            # missing they will throw errors), ignore those.
            if errors:
                return errors

        replace_emptry_strings(properties)

        # get a copy of the existing record
        # data
        update_expressions = []
        expression_attr_values = {}

        token = ':p'
        update_expressions.append("properties={0}".format(token))
        expression_attr_values[token] = decimal_decoder(properties)

        token = ':g'
        update_expressions.append("geometry={0}".format(token))
        expression_attr_values[token] = decimal_decoder(geometry)

        response = fishfry_table.update_item(
            Key={'id': ffid, 'type': "Feature"},
            UpdateExpression="set {0}".format(", ".join(update_expressions)),
            ExpressionAttributeValues=expression_attr_values,
            ReturnValues="UPDATED_NEW"
        )
        if return_copy:
            return get_one_fishfry(ffid)
        else:
            return ffid


def hide_one_fishfry(ffid):
    """Shortcut for unpublishing/invalidating a fishfry. Sets 'publish' and 'validated'
    properties to False only

    Arguments:
        ffid {string} -- fish fry id

    Returns:
        [type] -- [description]
    """

    response = fishfry_table.update_item(
        Key={'id': ffid, 'type': "Feature"},
        UpdateExpression="set properties.validated=:v, properties.publish=:p",
        ExpressionAttributeValues={
            ':v': False,
            ':p': False
        },
        ReturnValues="UPDATED_NEW"
    )
    return response


def delete_one_fishfry(ffid):
    """Delete a fishfry. This removes the record from the database entirely.

    Arguments:
        ffid {string} -- fish fry id

    Returns:
        [type] -- [description]
    """

    # check that the record to delete exists first.
    response = get_one_fishfry(ffid)
    if 'properties' in response.keys():
        try:
            response = fishfry_table.delete_item(
                Key={'id': ffid, 'type': "Feature"}
            )
            logging.info("DeleteItem succeeded:", ffid)
            # logging.info(json.dumps(response, cls=DecimalEncoder))
            return {"message": "Fish Fry {0} was removed from the database".format(ffid), 'class': 'info'}
        except ClientError as e:
            msg = "Database error when attempting to delete {0}. {1}".format(
                ffid, e.response['Error']['Message'])
            logging.error(msg)
            return {"message": msg, 'class': 'danger'}
    else:
        # logging.error("Error with delete")
        return {"message":  "Fish Fry {0} does not exist in the the database".format(ffid), 'class': 'danger'}
