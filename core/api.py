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
from flask import jsonify, redirect
import flask_restful
from flask_restful import Resource
from flasgger import Swagger, swag_from
import geojson

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
# Helper class to convert a DynamoDB item to JSON.


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

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
                examples: {"type": "FeatureCollection", "features": [{"cartodb_id": 282, "season": 2018, "geometry": {"type": "Point", "coordinates": [-79.923314, 40.456095]}, "properties": {"menu": {"url": null, "text": "see website"}, "take_out": true, "lunch": null, "handicap": null, "events": {"2018-02-16T17:00:00-05:00/2018-02-16T19:30:00-05:00": {"dt_start": "2018-02-16T17:00:00-05:00", "dt_end": "2018-02-16T19:30:00-05:00"}, "2018-03-02T17:00:00-05:00/2018-03-02T19:30:00-05:00": {"dt_start": "2018-03-02T17:00:00-05:00", "dt_end": "2018-03-02T19:30:00-05:00"}, "2018-03-16T17:00:00-04:00/2018-03-16T19:30:00-04:00": {"dt_start": "2018-03-16T17:00:00-04:00", "dt_end": "2018-03-16T19:30:00-04:00"}, "2018-03-09T17:00:00-05:00/2018-03-09T19:30:00-05:00": {"dt_start": "2018-03-09T17:00:00-05:00", "dt_end": "2018-03-09T19:30:00-05:00"}, "2018-03-23T17:00:00-04:00/2018-03-23T19:30:00-04:00": {"dt_start": "2018-03-23T17:00:00-04:00", "dt_end": "2018-03-23T19:30:00-04:00"}, "2018-02-23T17:00:00-05:00/2018-02-23T19:30:00-05:00": {"dt_start": "2018-02-23T17:00:00-05:00", "dt_end": "2018-02-23T19:30:00-05:00"}}, "publish": false, "venue_notes": null, "website": "http://www.sacredheartparishshadyside.org/Fish-Fry", "venue_name": "Sacred Heart Parish", "validated": false, "homemade_pierogies": null, "phone": "412-361-3131", "venue_type": "Church", "etc": "Fridays of Lent (except Good Friday) 5-7:30", "alcohol": null, "venue_address": "310 Shady Avenue, Pittsburgh, PA 15206", "email": null, "cartodb_id": 282}}]}
        """
        fishfry_table = dynamo_db.tables['FishFryDB']
        features = fishfry_table.scan()
        if "Items" in features.keys() and features["Items"]:
            feature_collection = geojson.FeatureCollection(features["Items"])
            # pass dictionary through json parser to process Decimal types
            response = json.loads(json.dumps(
                feature_collection, cls=DecimalEncoder))
            return response
        else:
            return features

#----------------------------------------------------------------------------
# API ROUTES
# accessed via /api c/o Flask-Restful
# docs accessed via /apidocs, c/o Flasgger

api_blueprint.add_resource(FishFry, '/api/fishfries/')

@application.route('/api/')
def api():
    return redirect('/apidocs')
