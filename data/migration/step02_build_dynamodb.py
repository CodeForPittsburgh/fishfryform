import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-west-2', endpoint_url="http://localhost:8000")

table = dynamodb.create_table(
    TableName='FishFryDB',
    KeySchema=[
        {
            'AttributeName': 'ffid',
            'KeyType': 'HASH'  #Partition key
        },
        {
            'AttributeName': 'season',
            'KeyType': 'RANGE'  #Sort key
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'ffid',
            'AttributeType': 'S'
        },
        {
            'AttributeName': 'season',
            'AttributeType': 'N'
        },

    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 10,
        'WriteCapacityUnits': 10
    }
)

print("Table status:", table.table_status)
for i in dynamodb.tables.pages():
    print(i)