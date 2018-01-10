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

import flask_restful
from flask_restful import Resource
from flasgger import Swagger, swag_from

from . import application

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
        #   "host": "mysite.com",  # overrides localhost:5000
        # "basePath": "/api",  # base bash for blueprint registration
        "schemes": [
            "http",
            "https"
        ]
    }
)

class FishFry(Resource):
    """Fish Fry API resource
    """
    @swag_from('docs/apidocs-fishfry-get.yaml')
    def get(self):
        """get Fish Frys

        Decorators:
            swag_from
        """

        return {"data":"Nothing here yet!"}

#----------------------------------------------------------------------------
# API ROUTES
# accessed via /api c/o Flask-Restful
# docs accessed via /apidocs, c/o Flasgger

api_blueprint.add_resource(FishFry, '/fishfry/')
