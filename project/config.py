# project/_config.py

import os

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# Enable debug mode.
DEBUG = True

# Secret key for session management. You can generate random strings here:
# http://clsc.net/tools-old/random-string-generator.php
SECRET_KEY = 'i\xf8\x95\xc2\x0e\xfc8\x04\xbd\x07\xbeLA*\x14\x8f\xeb##T\x01-\xd8\xff'

# Connect to the database
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'database.db')

# CARTO SQL API URL
CARTO_SQL_API_URL = 'https://christianbgass.carto.com/api/v2/sql'
CARTO_SQL_API_KEY = 'x'