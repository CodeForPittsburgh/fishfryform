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
import petl as etl

from .. import application
from ..models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu
from . import api_specs
from . import db_interface

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


# argument validators
parser = reqparse.RequestParser()
parser.add_argument(
    'ffid', type=str, help='unique identifer for each fish fry')
parser.add_argument('validated', type=inputs.boolean)
parser.add_argument('published', type=inputs.boolean)
parser.add_argument('strict', type=inputs.boolean)
# parser.add_argument('f', type=str, choices=["geojson", "csv"])


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

        return db_interface.get_all_fishfries(published=published, validated=validated)


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
            return db_interface.get_one_fishfry(ffid=ffid)
        # return all fish fries
        else:
            return db_interface.get_all_fishfries(published=published, validated=validated)

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
        response = db_interface.make_one_fishfry(
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

            response = db_interface.update_one_fishfry(
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
            return db_interface.delete_one_fishfry(ffid=ffid)
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
