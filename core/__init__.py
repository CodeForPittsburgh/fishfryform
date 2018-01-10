"""
core application module

initializes the Flask application, sets up the database, and provides access 
to a few non-blueprinted routes.

"""

# ----------------------------------------------------------------------------
# IMPORTS

from flask import Flask, render_template, redirect
import flask_sqlalchemy
import flask_admin
import flask_restful

import flasgger

#----------------------------------------------------------------------------
# CONFIGURATION

# Flask
application = Flask(__name__)
# Flask Configuration
application.config.from_pyfile('config.py')
# Application database connection
application_db = flask_sqlalchemy.SQLAlchemy(application)

# application
from .admin import admin_blueprint
from .api import api_blueprint


#----------------------------------------------------------------------------
# Routes

@application.route('/')
def home():
    return redirect('/admin')

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