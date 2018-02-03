"""
core/api.py

A Flask-Restful- and Flasgger-based interface to the Fish Fry database

Define API resources and API docs here

# Get a single existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>/', methods=['GET'])
def api_fishfry(ff_id):

return a single fish fry as geojson using the id (primary key from db)


# Get all Fish Fries
@app.route('/api/fishfrys', methods=['GET'])
@app.route('/api/fishfrys/', methods=['GET'])
def api_fishfrys():
return all fish fries as geojson
"""
import decimal
import uuid
import json
from flask import redirect, request
import flask_restful
from flask_restful import Resource, reqparse, inputs
from flasgger import Swagger, swag_from
import geojson
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import petl as etl

from .. import application
from .. import dynamo_db
from ..models import FishFry, FishFryProperties, FishFryEvent, FishFryMenu
# from api_specs import get_FishFry, post_FishFry
from . import api_specs

# API Blueprint
api_blueprint = flask_restful.Api(application)

#----------------------------------------------------------------------------
# Swagger API init
swag = Swagger(
    application,
    template={
        "info": {
            "title": "Fish Fry Map API",
            "description": "API for Fish Fry data collected and maintained by Code for Pittsburgh",
            "contact": {
                "responsibleOrganization": "Code for Pittsburgh",
                "responsibleDeveloper": "Christian Gass",
                "email": "christian.gass@civicmapper.com",
                "url": "http://codeforpittsburgh.github.io",
            },
            "version": "0.1.0"
        },
        #  "host": "mysite.com",  # overrides localhost:5000
        # "basePath": "/api",  # base bash for blueprint registration
        # "specs_route": "/apidocs/",
        "schemes": [
            "http",
            "https"
        ]
    }
)


#----------------------------------------------------------------------------
# API HELPERS

# reference to the table
fishfry_table = dynamo_db.tables['FishFryDB']

# argument validators
parser = reqparse.RequestParser()
parser.add_argument(
    'ffid', type=str, help='unique identifer for each fish fry')
parser.add_argument('validated', type=inputs.boolean)
parser.add_argument('published', type=inputs.boolean)
parser.add_argument('strict', type=inputs.boolean)
# parser.add_argument('f', type=str, choices=["geojson", "csv"])


# Helper Functions

def geojson_fc_to_csv(fc):
    rows = []
    for f in fc['features']:
        feature = {}
        feature.update(f['properties'])
        geom = f['geometry']['coordinate']
        feature.update({'lon': geom[0], 'lat': geom[1]})
        rows.append(feature)
    table = etl.fromdicts(rows)
    return etl.lookall(table)


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
        return json.loads(
            json.dumps(feature_collection, cls=DecimalEncoder)
        )
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


#----------------------------------------------------------------------------
# API Resources


class FishFries(Resource):
    """
    Get a complete, ready-to-map GeoJSON Feature Collection of Fish Fries
    """
    @swag_from(api_specs.get_FishFries, validation=False)
    def get(self):
        """
        get all Fish Fries as a GeoJSON Feature Collection
        """

        args = parser.parse_args()

        published = args['published']
        validated = args['validated']
        # fmt = args['f']

        return get_all_fishfries(published=published, validated=validated)


class FishFry(Resource):
    """Fish Fry API resource
    """
    @swag_from(api_specs.get_FishFry)
    def get(self):
        """
        get one Fish Fry as geojson
        """

        args = parser.parse_args()
        # print(args)

        ffid = args['ffid']
        published = args['published']
        validated = args['validated']

        # handle request for a single fish fry. published/validated args are ignored.
        if ffid:
            return get_one_fishfry(ffid=ffid)
        # return all fish fries
        else:
            return get_all_fishfries(published=published, validated=validated)

    @swag_from(api_specs.post_FishFry)
    def post(self):
        """
        Add a new Fish Fry. Submit a geojson feature object that contains the properties and geometry objects. Use the optional "strict" parameter to have validation feedback performed on the submission.
        """
        args = parser.parse_args()
        strict = args['strict']
        data = request.get_json()
        properties, geometry = None, None
        if 'properties' in data.keys():
            properties = data['properties']
        if 'geometry' in data.keys():
            geometry = data['geometry']

        # assuming schema is good, submit data to database
        response = make_one_fishfry(
            properties=properties, geometry=geometry, strict=strict)
        return response

    @swag_from(api_specs.put_FishFry)
    def put(self):
        """
        Update an existing Fish Fry. This expects, minimally, a complete properties object, so start with a fish fry you've acquired from api/fishfries
        """

        args = parser.parse_args()
        strict = args['strict']
        data = request.get_json()

        if ('id' not in data.keys()) and ('ffid' not in args.keys()):
            return {"Error": "No ID was submitted with the data"}
        else:
            if 'id' in data.keys():
                ffid = data['id']
            else:
                ffid = args['ffid']

            properties, geometry = None, None
            if 'properties' in data.keys():
                properties = data['properties']
            if 'geometry' in data.keys():
                geometry = data['geometry']

            response = update_one_fishfry(
                ffid=ffid, properties=properties, geometry=geometry, strict=strict)
            return response

    @swag_from(api_specs.del_FishFry)
    def delete(self):
        """delete an existing fish fry
        """
        args = parser.parse_args()
        # print(args)

        ffid = args['ffid']

        # handle request for a single fish fry. published/validated args are ignored.
        if ffid:
            return delete_one_fishfry(ffid=ffid)
        else:
            return {"ERROR: you must provide a Fish Fry ID"}


#----------------------------------------------------------------------------
# API ROUTES
# accessed via /api c/o Flask-Restful
# docs accessed via /apidocs, c/o Flasgger


api_blueprint.add_resource(FishFries, '/api/fishfries/')
api_blueprint.add_resource(FishFry, '/api/fishfry/')


@application.route('/api/')
def api():
    return redirect('/apidocs')
