"""
Functions that talk to Dynamo DB
"""

import json
import decimal
import geojson
import uuid
import logging
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from copy import copy

from marshmallow import ValidationError

from .. import dynamo_db
from ..models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, FishFryFeatureCollection, Geometry

# reference to the table
fishfry_table = dynamo_db.tables['FishFryDB']
fishfry_stats = dynamo_db.tables['FishFryStats']

class DecimalEncoder(json.JSONEncoder):
    """use to convert any DynamoDB items stored as Decimal objects to numbers.
    """

    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def decimal_decoder(json_obj):
    """convert any floats in a dictionary (loaded from a json) to Decimal type.
    This is required in order to load data to DynamoDB.
    """
    return json.loads(json.dumps(json_obj), parse_float=decimal.Decimal)

def decimal_encoder(json_obj):
    return json.loads(json.dumps(json_obj, cls=DecimalEncoder))


def _paginated_scan(ddb_table):
    """performs a paginated scan of the DynamoDB table
    """
    
    response = ddb_table.scan()
    data = response['Items']
    print(len(data))

    while response.get('LastEvaluatedKey'):
        response = ddb_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        addl_data = response['Items']
        print(len(addl_data))
        data.extend(addl_data)

    return {'Items': data, 'Count': len(data)}

def retrieve_all_records(ddb_table):
    """ query the DB and decode
    """

    return json.loads(
        json.dumps(
            _paginated_scan(ddb_table), 
            cls=DecimalEncoder
        )
    )

def is_not_blank(s):
    return bool(s and s.strip())

def replace_emptry_strings(a_dict):
    """use to convert empty strings to None values; DynamoDB doesn't like
    empty strings
    """
    for k, v in a_dict.items():
        if not isinstance(v, dict):
            if isinstance(v, str):
                if not is_not_blank(v):
                    a_dict[k] = None
        else:
            replace_emptry_strings(v)


def get_all_fishfries(published=None, validated=None, has_geom=True):
    """get all fish fries as a GeoJSON Feature Collection. Filter records based on
    validation and publication status.

    :param published: [description], defaults to None
    :type published: bool, optional
    :param validated: [description], defaults to None
    :type validated: bool, optional
    :param has_geom: [description], defaults to True
    :type has_geom: bool, optional
    
    """

    # this effectively returns  the "features" array of a GeoJSON Feature Collection
    response = retrieve_all_records(fishfry_table)
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

    :param ffid: fish fry id
    :type ffid: str
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
    """adds a new fish fry to the database; then retrieves it and returns the result

    :param properties: [description]
    :type properties: [type]
    :param geometry: [description]
    :type geometry: [type]
    :param strict: [description], defaults to False
    :type strict: bool, optional
    :param return_copy: [description], defaults to True
    :type return_copy: bool, optional
    :param record_stats: dict w/ kwargs for the record_stats() function, defaults to False
    :type record_stats: dict, optional    
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

    :param ffid: fish fry id
    :type ffid: str
    :param properties: [description]
    :type properties: [type]
    :param geometry: [description]
    :type geometry: [type]
    :param strict: [description], defaults to False
    :type strict: bool, optional
    :param return_copy: [description], defaults to True
    :type return_copy: bool, optional
    :param record_stats: dict w/ kwargs for the record_stats() function, defaults to False
    :type record_stats: dict, optional
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

    :param ffid: fish fry id
    :type ffid: str
    :param record_stats: dict w/ kwargs for the record_stats() function, defaults to False
    :type record_stats: dict, optional
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

    :param ffid: fish fry id
    :type ffid: str
    :param record_stats: dict w/ kwargs for the record_stats() function, defaults to False
    :type record_stats: dict, optional
    """

    # check that the record to delete exists first.
    response = get_one_fishfry(ffid)
    if 'properties' in response.keys():
        try:
            response = fishfry_table.delete_item(
                Key={'id': ffid, 'type': "Feature"}
            )
            logging.info("DeleteItem succeeded: {0}".format(ffid))
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


def record_stat(userid, ffid, what):
    """record a running tally of whatever action just occured to FishFryStats--e.g., add, updated, delete--so we can have a leaderboard. Nothing too fancy.

    :param userid: user that did the thing
    :type userid: str
    :param ffid: fishfry id that was added/updated/hidden/deleted
    :type ffid: str
    :param what: what the user did: add/update/hide/delete
    :type what: str
    """
    timestamp = datetime.utcnow().isoformat()
    payload = dict(
        userid=userid,
        when=timestamp,
        ffid=ffid,
        what=what
    )
    # print(payload)
    try:
        r = fishfry_stats.put_item(
            Item=payload
        )
        # print(r)
        logging.debug("stats: recorded {0} for {1}".format(what, ffid))
    except:
        logging.error("stats: unable to record {0} for {1}".format(what, ffid))


def get_stats(userid=None, after_when=None, before_when=None):
    """get summary stats for users in a date time range. response is a dictionary
    structured for use in ChartJS (though is probably useable with other charting libraries)
    
    :param userid: [description], defaults to None
    :param userid: [type], optional
    :param after_when: [description], defaults to None
    :param after_when: [type], optional
    :param before_when: [description], defaults to None
    :param before_when: [type], optional
    """

    response = None

    if all([userid, after_when, before_when]):
        response = fishfry_stats.scan(
            FilterExpression=\
                Attr('userid').contains(userid) & \
                Attr('when').gt(after_when) & \
                Attr('when').lt(before_when)
        )

    elif all([after_when, before_when]) and not userid:
        response = fishfry_stats.scan(
            FilterExpression=\
                Attr('when').gt(after_when) & \
                Attr('when').lt(before_when)
        )

    elif after_when and not all([userid, before_when]):
        response = fishfry_stats.scan(
            FilterExpression=\
                Attr('when').gt(after_when)
        )
    elif before_when and not all([userid, after_when]):
        response = fishfry_stats.scan(
            FilterExpression=\
                Attr('when').lt(before_when)
        )        

    elif userid and not all([after_when, before_when]):
        response = fishfry_stats.scan(
            FilterExpression=Attr('userid').contains(userid)
        )

    else:
        # not all([userid, after_when, before_when]):
        response = fishfry_stats.scan()

    tally = {}

    if 'Items' in response.keys():
        if len(response['Items']) > 0:
            
            for i in response['Items']:
                # if user is not already in the tally:
                if i['userid'] not in tally.keys():
                    # create a new record for them
                    tally.update({
                        i['userid']: {
                            'add': 0,
                            'update': 0,
                            'hide': 0,
                            'delete': 0
                        }
                    })
                # otherwise proceed with adding to the count
                tally[i['userid']][i['what']] += 1

            labels = []
            add_data = []
            update_data = []
            hide_data = []
            del_data = []

            for userid, data in tally.items():
                labels.append(userid)
                add_data.append(data['add'])
                update_data.append(data['update'])
                hide_data.append(data['hide'])
                del_data.append(data['delete'])

            # return the data (directly useable by ChartJS)
            data = dict(
                labels=labels,
                datasets=[
                    dict(
                        label='Adds',
                        data=add_data
                    ),
                    dict(
                        label='Updates',
                        data=update_data
                    ),
                    dict(
                        label='Un-publishes',
                        data=hide_data
                    ),
                    dict(
                        label='Deletes',
                        data=del_data
                    )                        
                ]
            )
            return data