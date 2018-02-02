"""
core/api.py

A Flask-Restful- and Flasgger-based interface to the Fish Fry database

Define API resources and API docs here

## Get a single existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>/', methods=['GET'])
def api_fishfry(ff_id):

return a single fish fry as geojson using the id (primary key from db)


## Get all Fish Fries
@app.route('/api/fishfrys', methods=['GET'])
@app.route('/api/fishfrys/', methods=['GET'])
def api_fishfrys():
return all fish fries as geojson
"""
import decimal
import json
from flask import redirect, request
import flask_restful
from flask_restful import Resource, reqparse, inputs
from flasgger import Swagger
import geojson
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from . import application
from . import dynamo_db

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
parser.add_argument('ffid',type=str,help='unique identifer for each fish fry')
parser.add_argument('validated', type=inputs.boolean)
parser.add_argument('published', type=inputs.boolean)

# Helper Functions

class DecimalEncoder(json.JSONEncoder):
    """convert any DynamoDB items stored as Decimal objects to numbers.
    """
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

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
        return json.loads(response)
    return None

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
                features = ([x for x in features if not x['properties']['publish']])
            else: # published == False:
                features = ([x for x in features if x['properties']['publish']])
        # handle the "validated" parameter
        if validated is not None:
            if validated is False:
                features = ([x for x in features if not x['properties']['validated']])
            else: # validated == False:
                features = ([x for x in features if x['properties']['validated']])
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

def make_one_fishfry(properties=None, geometry=None, lat=None, lon=None):

    #TODO: run the args through the marshmallow schema. Return those responses as appropriate
    
    # new id
    ffid = str(uuid.uuid4())
    # print("new feature", ffid)
    feature = {
        'id': ffid,
        'type': "Feature"
    }
    if properties:
        feature['properties'] = properties
    if geometry:
        feature['geometry'] = 'geometry'
    # create new records
    response = fishfry_table.put_item(
        Item=feature
    )
    return response

def update_one_fishfry(ffid, properties=None, geometry=None, lat=None, lon=None):

    #TODO: run the args through the marshmallow schema. Return those responses as appropriate

    update_expressions = []
    expression_attr_values = {}

    if properties:
        token = ':p'
        update_expressions.append("properties={0}".format(token))
        expression_attr_values[token] = properties

    if geometry and not (lat and lon):
        token = ':g'
        update_expressions.append("geometry={0}".format(token))
        expression_attr_values[token] = geometry
    
    response = fishfry_table.update_item(
        Key = {'id':ffid,'type':"Feature"},
        UpdateExpression="set {0}".format(", ".join(update_expressions)),
        ExpressionAttributeValues=expression_attr_values,
        ReturnValues="UPDATED_NEW"
    )
    return response

def hide_one_fishfry(ffid):
    """Shortcut for unpublishing/invalidating a fishfry. Sets 'publish' and 'validated'
    properties to False only
    
    Arguments:
        ffid {string} -- fish fry id
    
    Returns:
        [type] -- [description]
    """

    response = fishfry_table.update_item(
        Key = {'id':ffid,'type':"Feature"},
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
        Key={'ffid':ffid},
        UpdateExpression="set properties.validated=:pv, properties.publish=:pp",
        ExpressionAttributeValues={
            ':pv': False,
            ':pp': False
        },
        ReturnValues="UPDATED_NEW"
    )
    try:
        response = fishfry_table.delete_item(
            Key={'ffid':ffid}
        )
    except ClientError as e:
        if e.response['Error']['Code'] == "ConditionalCheckFailedException":
            print(e.response['Error']['Message'])
        else:
            raise
    else:
        print("DeleteItem succeeded:")
        print(json.dumps(response, indent=4, cls=DecimalEncoder))

#----------------------------------------------------------------------------
# API Resources

class FishFry(Resource):
    """Fish Fry API resource
    """
    # @swag_from('docs/apidocs-fishfry-get.yaml')

    def get(self):
        """get all Fish Frys
        ---
        tags: 
        - fishfries
        responses:
            200:
                description: a geojson FeatureCollection of all Fish Fries; all Fish Fries are contained within the "features" object"
                examples: {
                    "type": "Feature",
                    "properties": {
                        "venue_notes": null,
                        "website": null,
                        "venue_name": "Greenock VFC",
                        "email": null,
                        "validated": false,
                        "homemade_pierogies": null,
                        "phone": "412-751-7655",
                        "venue_type": "Fire Department",
                        "venue_address": "1002 Greenock Buena Vista Rd. Greenock, PA 15047",
                        "menu": {
                            "text": null,
                            "url": "https://www.facebook.com/GreenockVFC/photos/a.624897470873255.23562323.123240447705629/1623149671048025/?type=3&theater"
                        },
                        "lunch": false,
                        "etc": null,
                        "cartodb_id": 10.0,
                        "take_out": null,
                        "publish": false,
                        "handicap": null,
                        "events": [{
                                "dt_start": "2018-02-23T16:00:00-05:00",
                                "dt_end": "2018-02-23T19:00:00-05:00"
                            },
                            {
                                "dt_start": "2018-03-02T16:00:00-05:00",
                                "dt_end": "2018-03-02T19:00:00-05:00"
                            },
                            {
                                "dt_start": "2018-03-16T16:00:00-04:00",
                                "dt_end": "2018-03-16T19:00:00-04:00"
                            },
                            {
                                "dt_start": "2018-03-09T16:00:00-05:00",
                                "dt_end": "2018-03-09T19:00:00-05:00"
                            },
                            {
                                "dt_start": "2018-03-23T16:00:00-04:00",
                                "dt_end": "2018-03-23T19:00:00-04:00"
                            },
                            {
                                "dt_start": "2018-03-30T16:00:00-04:00",
                                "dt_end": "2018-03-30T19:00:00-04:00"
                            }
                        ],
                        "alcohol": null
                    },
                    "id": "12ef7e40-88b7-49e1-ac5f-c03c1fb7ba8b",
                    "geometry": {
                        "coordinates": [-79.796407,
                            40.309443
                        ],
                        "type": "Point"
                    }
                }
        """

        args = parser.parse_args()
        print(args)

        ffid = args['ffid']
        published = args['published']
        validated = args['validated']
        
        # handle request for a single fish fry. published/validated args are ignored.
        if ffid:
            return get_one_fishfry(ffid=ffid)
        # return all fish fries
        else:
            return get_all_fishfries(published=published, validated=validated)

    def post(self):

        data = request.get_json()
        properties, geometry = None, None
        if 'properties' in data.keys():
            properties = data['properties']
        if 'geometry' in data.keys():
            geometry = data['geometry']

        # assuming schema is good, submit data to database
        response = make_one_fishfry(properties=properties, geometry=geometry)
        return response

    def put(self):

        args = parser.parse_args()
        

        data = request.get_json()

        if ('id' not in data.keys()) and ('ffid' not in args.keys()):
            return {}
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
            
            response = update_one_fishfry(ffid=ffid, properties=properties, geometry=geometry)
            return response

#----------------------------------------------------------------------------
# API ROUTES
# accessed via /api c/o Flask-Restful
# docs accessed via /apidocs, c/o Flasgger

api_blueprint.add_resource(FishFry, '/api/fishfries/')

@application.route('/api/')
def api():
    return redirect('/apidocs')