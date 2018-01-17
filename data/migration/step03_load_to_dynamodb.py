'''
load the geosjon file to dynamodb. features = rows
'''
import json
import decimal
import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-west-2', endpoint_url="http://localhost:8000")

table = dynamodb.Table('FishFryDB')

geojson_to_load = "fishfrymap2018starter2.geojson"

# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

with open(geojson_to_load) as json_file:
    fishfries = json.load(json_file, parse_float=decimal.Decimal)
    for fishfry in fishfries['features']:
        print(json.dumps(fishfry, indent=2, cls=DecimalEncoder))
        table.put_item(
           Item=fishfry
        )