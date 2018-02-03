"""
Functions that talk to Dynamo DB
"""

import json
import decimal
import geojson
import uuid
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from .. import dynamo_db
from ..models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu

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


def get_all_fishfries(published=None, validated=None):
    """get fish fries as GeoJSON

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
            print(len(features))

        # build a feature collection (as a dict
        feature_collection = geojson.FeatureCollection(features)
        # pass dictionary through json parser to process Decimal types
        result = json.loads(
            json.dumps(feature_collection, cls=DecimalEncoder)
        )
        return result
    else:
        return response
    return None


def get_one_fishfry(ffid):
    """get a single fish fry record

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


def make_one_fishfry(properties, geometry=None, lat=None, lon=None, strict=True):

    if not properties:
        return {'Error': 'Submitted json does not include a required object (properties)'}
    else:
        if strict:
            # Run the args through the marshmallow schema
            data, errors = FishFryProperties().load(properties)
            # If errors, return those
            if errors:
                return errors
        # new id
        ffid = str(uuid.uuid4())
        # print("new feature", ffid)
        feature = {
            'id': ffid,
            'type': "Feature"
        }
        feature['properties'] = decimal_decoder(properties)
        if geometry:
            feature['geometry'] = decimal_decoder(geometry)
        # create new records
        response = fishfry_table.put_item(
            Item=feature
        )
        new_fishfry = get_one_fishfry(ffid)
        return new_fishfry


def update_one_fishfry(ffid, properties=None, geometry=None, lat=None, lon=None, strict=True):

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

        # get a copy of the existing record
        # existing_fry = get_one_fishfry(ffid)

        # data

        update_expressions = []
        expression_attr_values = {}

        if properties:
            token = ':p'
            update_expressions.append("properties={0}".format(token))
            expression_attr_values[token] = decimal_decoder(properties)

        if geometry:
            token = ':g'
            update_expressions.append("geometry={0}".format(token))
            expression_attr_values[token] = decimal_decoder(geometry)

        response = fishfry_table.update_item(
            Key={'id': ffid, 'type': "Feature"},
            UpdateExpression="set {0}".format(", ".join(update_expressions)),
            ExpressionAttributeValues=expression_attr_values,
            ReturnValues="UPDATED_NEW"
        )
        updated_fishfry = get_one_fishfry(ffid)
        return updated_fishfry


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

    response = fishfry_table.update_item(
        Key={'ffid': ffid},
        UpdateExpression="set properties.validated=:pv, properties.publish=:pp",
        ExpressionAttributeValues={
            ':pv': False,
            ':pp': False
        },
        ReturnValues="UPDATED_NEW"
    )
    try:
        response = fishfry_table.delete_item(
            Key={'ffid': ffid}
        )
    except ClientError as e:
        return {"Error": e.response['Error']['Message']}
    else:
        # print("DeleteItem succeeded:")
        # print(json.dumps(response, indent=4, cls=DecimalEncoder))
        return {"Success": "Fish Fry {0} was removed from the database".format(ffid)}
