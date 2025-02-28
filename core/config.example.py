"""
config.py

Flask application configuration constants

"""

import os

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# debug and testing modes
DEBUG = True
TESTING = False

# CSRF handling
WTF_CSRF_ENABLED = True

# Secret key for session management.
SECRET_KEY = ''

# Local database (admin / user management only)
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'admin.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

# AWS DYNAMODB DATABASE
AWS_ACCESS_KEY_ID = ""
AWS_SECRET_ACCESS_KEY = ""
AWS_REGION = ""
DYNAMO_ENABLE_LOCAL = False
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

# indicate if fish fry transactions are to be logged for the leaderboard.
LEADERBOARD_ON = True

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
SECURITY_REGISTERABLE = False
SECURITY_CONFIRMABLE = False

# Flask-Security optionally sends email notification to users upon registration, password reset, etc.
# It uses Flask-Mail behind the scenes.
# Set mail-related config values.
# Replace this with your own "from" address
SECURITY_EMAIL_SENDER = ''
# Replace the next five lines with your own SMTP server settings
MAIL_SERVER = ''
MAIL_PORT = 000
MAIL_USE_TLS = True
MAIL_USERNAME = ''
MAIL_PASSWORD = ''
SECURITY_EMAIL_SUBJECT_PASSWORD_RESET = "Fish Fry Form: Password reset instructions"
SECURITY_EMAIL_SUBJECT_PASSWORD_NOTICE = "Fish Fry Form: Your password has been reset"
SECURITY_EMAIL_SUBJECT_PASSWORD_CHANGE_NOTICE = "Fish Fry Form: Your password has changed"
SECURITY_EMAIL_SUBJECT_REGISTER = "Fish Fry Form: Welcome!"
SECURITY_EMAIL_SUBJECT_CONFIRM = "Fish Fry Form: Please confirm your e-mail address"

# Admin View Configuration
FLASK_ADMIN_SWATCH = 'sandstone'
