"""
core application module

initializes the Flask application, sets up the database, and provides access 
to a few non-blueprinted routes.

"""

# ----------------------------------------------------------------------------
# IMPORTS

from flask import Flask, render_template, redirect
import flask_sqlalchemy
from flask_dynamo import Dynamo
from flask_security import login_required

#----------------------------------------------------------------------------
# CONFIGURATION

# Flask
application = Flask(__name__)
# Flask Configuration
application.config.from_pyfile('config.py')
# Application database connection (for user management only)
application_db = flask_sqlalchemy.SQLAlchemy(application)
# Remote database (for operational data)
dynamo_db = Dynamo(application)

# application
from .admin import admin_blueprint
from .api import api_blueprint


#----------------------------------------------------------------------------
# Routes

@application.route('/')
def home():
    return render_template('pages/home.html')

@application.route('/map')
def map():
    return redirect('https://codeforpittsburgh.github.io/fishfrymap')

@application.route('/contribute')
def contribute():
    return render_template('pages/fishfrytable.html')

## empty form view
@application.route('/contribute/fishfry/')
# @login_required
def new_fishfry():
    return render_template('pages/fishfryform.html')

#----------------------------------------------------------------------------
# Error Handling Routes

@application.errorhandler(500)
def internal_error(error):
    """
    ## Error handler 500
    """
    return render_template('errors/500.html'), 500

@application.errorhandler(404)
def not_found_error(error):
    """
    ## Error handler 404
    """
    return render_template('errors/404.html'), 404