import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-west-2', endpoint_url="http://localhost:8000")

table = dynamodb.create_table(
    TableName='FishFryDB',
    KeySchema=[
        {
            'AttributeName': 'season',
            'KeyType': 'HASH'  #Partition key
        },
        {
            'AttributeName': 'cartodb_id',
            'KeyType': 'RANGE'  #Sort key
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'season',
            'AttributeType': 'N'
        },
        {
            'AttributeName': 'cartodb_id',
            'AttributeType': 'N'
        },

    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 10,
        'WriteCapacityUnits': 10
    }
)

print("Table status:", table.table_status)
for i in db.tables.pages():
    print(i)