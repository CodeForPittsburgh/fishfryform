"""
config.py

Flask application configuration constants

"""

import os

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# Enable debug mode.
DEBUG = True

# Secret key for session management.
SECRET_KEY = ''

# Local database (admin / user management only)
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'admin.db')

# AWS DYNAMODB DATABASE
AWS_ACCESS_KEY_ID = ""
AWS_SECRET_ACCESS_KEY = ""
AWS_REGION = ""
DYNAMO_ENABLE_LOCAL = True
DYNAMO_LOCAL_HOST = 'localhost'
DYNAMO_LOCAL_PORT = 8000
DYNAMO_TABLES = [
    {
        "TableName": 'FishFryDB',
        "KeySchema": [
            {'AttributeName': 'id', 'KeyType': 'HASH'},
            {'AttributeName': 'type', 'KeyType': 'RANGE'}
        ],
        "AttributeDefinitions": [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'type', 'AttributeType': 'S'},
        ],
        "ProvisionedThroughput": {'ReadCapacityUnits': 10, 'WriteCapacityUnits': 10}
    }, {
        "TableName": 'FishFryStats',
        "KeySchema": [
            {'AttributeName': 'userid', 'KeyType': 'HASH'},
            {'AttributeName': 'when', 'KeyType': 'RANGE'}
        ],
        "AttributeDefinitions": [
            {'AttributeName': 'userid', 'AttributeType': 'S'},
            {'AttributeName': 'when', 'AttributeType': 'S'},
        ],
        "ProvisionedThroughput": {'ReadCapacityUnits': 10, 'WriteCapacityUnits': 10}
    }
]

# SWAGGER API config
SWAGGER = {
    'title': 'Fish Fry API',
    'uiversion': 3
}

# Flask-Security config
#SECURITY_URL_PREFIX = "/"
SECURITY_PASSWORD_HASH = ""
SECURITY_PASSWORD_SALT = ""

# Flask-Security URLs, overridden because they don't put a / at the end
#SECURITY_LOGIN_URL = "/login/"
#SECURITY_LOGOUT_URL = "/logout/"
#SECURITY_REGISTER_URL = "/register/"

# Flask-Security features
SECURITY_RECOVERABLE = True
SECURITY_CHANGEABLE = True

# Flask-Security optionally sends email notification to users upon registration, password reset, etc.
# It uses Flask-Mail behind the scenes.
# Set mail-related config values.
# Replace this with your own "from" address
SECURITY_EMAIL_SENDER = ''
# Replace the next five lines with your own SMTP server settings
MAIL_SERVER = ''
MAIL_PORT = 465
MAIL_USE_SSL = True
MAIL_USERNAME = ''
MAIL_PASSWORD = ''
SECURITY_EMAIL_SUBJECT_PASSWORD_RESET = "Fish Fry Form: Password reset instructions"

# Admin View Configuration
FLASK_ADMIN_SWATCH = 'sandstone'
