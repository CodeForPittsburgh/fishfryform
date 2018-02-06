"""
explores some boto3 calls with this data
"""

import os
import json
import uuid
import boto3
import decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from core.api import fishfry_table, DecimalEncoder

dir_path = os.path.dirname(os.path.realpath(__file__))
feature_json = os.path.join(dir_path, r'feature.json')


# Load feature
with open(feature_json) as json_file:
    feature = json.load(json_file, parse_float=decimal.Decimal)


# new if
ffid = str(uuid.uuid4())
print("new feature", ffid)

# create new records
response = fishfry_table.put_item(
    Item={
        'id': ffid,
        'type': "Feature",
        'properties': feature['properties'],
        'geometry': feature['geometry']
    }
)

print("PutItem succeeded:")
print(json.dumps(response, indent=2, cls=DecimalEncoder))

# retrieve that record
try:
    response = fishfry_table.get_item(Key={'id': ffid, 'type': "Feature"})
except ClientError as e:
    print(e.response['Error']['Message'])
else:
    if 'Item' in response:
        item = response['Item']
        print("GetItem succeeded:")
        print(json.dumps(item, indent=2, cls=DecimalEncoder))
    else:
        print("GetItem did not succeed: No item found")


# update some things
response = fishfry_table.update_item(
    Key={'id': ffid, 'type': "Feature"},
    UpdateExpression="set properties.venue_address = :v, properties.publish=:p",
    ExpressionAttributeValues={
        ':v': "1234 Anywhere Street",
        ':p': True
    },
    ReturnValues="UPDATED_NEW"
)

print("UpdateItem succeeded:")
print(json.dumps(response, indent=2, cls=DecimalEncoder))

# update some things
response = fishfry_table.update_item(
    Key={'id': ffid, 'type': "Feature"},
    UpdateExpression="set properties = :p",
    ExpressionAttributeValues={
        ':p': feature['properties']
    },
    ReturnValues="UPDATED_NEW"
)

print("UpdateItem succeeded:")
print(json.dumps(response, indent=2, cls=DecimalEncoder))

try:
    response = fishfry_table.delete_item(
        Key={'id': ffid, 'type': "Feature"}
    )
except ClientError as e:
    print(e.response['Error']['Message'])
else:
    print("DeleteItem succeeded:")
    print(json.dumps(response, indent=2, cls=DecimalEncoder))
