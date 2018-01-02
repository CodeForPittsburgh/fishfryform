"""
main/api

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

from flask_restful import Resource
from flasgger import Swagger, swag_from

class FishFry(Resource):
    @swag_from('docs/apidocs-fishfry-get.yaml')
    def get(self):
        return {"data":"Nothing here yet!"}