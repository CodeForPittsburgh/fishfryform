"""
main application module

initializes the Flask application, sets up the database, and provides access 
to a few non-blueprinted routes.

"""

# ----------------------------------------------------------------------------
# IMPORTS

from flask import Flask, render_template
import flask_sqlalchemy
import flask_admin
import flask_restful
import flask_security
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
from .models import User, Role
from .admin import AdminFishFryView, AdminUserView, AdminModelView
from .api import FishFry

# User datastore registration (for flask-security)
user_datastore = flask_security.SQLAlchemyUserDatastore(application_db, User, Role)
# Application Security (flask-security)
security = flask_security.Security(application, user_datastore)
# Admin Bluprint (flask-admin)
admin_blueprint = flask_admin.Admin(
    application, 
    name='Fish Fry Map Admin',
    template_mode='bootstrap3'
)
# API Blueprint
api_blueprint = flask_restful.Api(application)
# Swagger API
swag = flasgger.Swagger(
    application,
    template={
        "info": {
            "title": "Fish Fry Map API",
            "description": "API for Fish Fry data collected and maintained by Code for Pittsburgh",
            "contact": {
            "responsibleOrganization": "Code for Pittsburgh",
            "responsibleDeveloper": "Christian Gass",
            "email": "christian.gass@civicmapper.com",
            "url": "http://codeforpittsburgh.github.io",
            },
            "version": "0.1.0"
        },
        #   "host": "mysite.com",  # overrides localhost:5000
        # "basePath": "/api",  # base bash for blueprint registration
        "schemes": [
            "http",
            "https"
        ]
    }
)

#----------------------------------------------------------------------------
# ADMIN ROUTES
# accessed via /admin, c/o Flask-Admin

admin_blueprint.add_view(AdminUserView(User, application_db.session))
admin_blueprint.add_view(AdminModelView(Role, application_db.session))
admin_blueprint.add_view(AdminFishFryView(FishFry, application_db.session))

#----------------------------------------------------------------------------
# API ROUTES
# accessed via /api c/o Flask-Restful
# docs accessed via /apidocs, c/o Flasgger

api_blueprint.add_resource(FishFry, '/fishfry/')

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


# ---------------------------------------------------------------------------
# Supporting things

# define a context processor for merging flask-admin's template context into the
# flask-security views.
@security.context_processor
def security_context_processor():
    return dict(
        admin_base_template=admin_blueprint.base_template,
        admin_view=admin_blueprint.index_view,
        h=admin_helpers,
        get_url=url_for
    )
