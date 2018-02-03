"""
core application module

initializes the Flask application, sets up the database, and provides access 
to a few non-blueprinted routes.

"""

# ----------------------------------------------------------------------------
# IMPORTS

# standard library
import json
# depedencies
from flask import Flask, render_template, redirect, request, url_for, flash, Markup
import flask_sqlalchemy
# application
from flask_dynamo import Dynamo
from flask_security import login_required
from flask_jsglue import JSGlue

#----------------------------------------------------------------------------
# APPLICATION SETUP

# Flask
application = Flask(__name__)
# Flask Configuration
application.config.from_pyfile('config.py')
# Application database connection (for user management only)
application_db = flask_sqlalchemy.SQLAlchemy(application)
# Remote database (for operational data)
dynamo_db = Dynamo(application)
# Expose Flask Routes to client-side
jsglue = JSGlue(application)

# application imports (these use the Flask "application" object, so get imported here)
from .admin import admin_blueprint
from .api import api_blueprint
from .api.db_interface import get_all_fishfries, get_one_fishfry, hide_one_fishfry
from .forms import FishFryForm


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

#----------------------------------------------------------------------------
# Routes for editing fish frys

# empty form


@application.route('/contribute/fishfry/new')
# @login_required
def new_fishfry():
    """Empty Fish Fry Form
    """
    return render_template(
        'pages/fishfryform.html',
        form=FishFryForm(request.form)
    )


@application.route('/contribute/fishfry/edit', methods=['GET', 'POST'])
# @login_required
def edit_fishfry():
    """gets a Fish Fry from the database using the Fish Fry id field,
    and loads it into the form for editing
    """
    ffid = request.args.get("ffid")
    if ffid:
        # get data for the one fishfry
        # onefry =  get_one_fishfry(ffid)
        return render_template(
            'pages/fishfryform.html',
            form=FishFryForm(request.form),
            # ff = json.dumps(onefry),
            ffid=ffid
        )
    else:
        return redirect(url_for('contribute'))


@application.route('/contribute/fishfry/submit', methods=['POST'])
#@login_required
def submit_fishfry():
    """endpoint for submitting a Fish Fry. Detects if Fish Fry is new or already exists.
    The new GeoJSON feature is submitted through this endpoint via a POST request.
    """
    # pdb.set_trace()
    error = None
    if request.method == 'POST':
        print("----------\n")

        fishfry_json = request.get_data()
        # then dump to a dictionary
        fishfry_dict = json.loads(fishfry_json)
        print(repr(fishfry_dict))

        # ----------------------------------------------------------------------
        # do a quick check on the geometry and map publication options
        # we can't publish data submitted if geom is null
        if not fishfry_dict['geometry']:
            fishfry_dict['properties']['publish'] = False

        # ----------------------------------------------------------------------
        # if there is an id already provided, then this is an existing
        # record, and we're doing an update.
        if fishfry_dict['ffid']:
            print("Existing record")

            return json.dumps({'redirect': None, 'response': ''})

        # ----------------------------------------------------------------------
        # if there is no cartodb_id, then this is a new record. build that query
        else:
            print("New record")
            # run the query, inserting a new record

            # we need to make or get the new id...

            # once the record is submitted, reload this page with the data.
            return json.dumps({'redirect': url_for('edit_fishfry', ffid=fishfry_dict['ffid']), 'response': ''})

    return render_template('pages/fishfrytable.html')


@application.route('/contribute/fishfrys/delete', methods=['POST'])
# @login_required
def delete_fishfry(ffid):
    """deletes a Fish Fry (actually just turns off validation and publication, so we don't see it)
    This route is called from the form page, and redirects to the contribute page.
    '/contribute/fishfrys/delete?ffid=<fish-fry-id-string>'
    """
    if request.method == 'POST' and request.args.get('ffid'):
        r = hide_one_fishfry(request.args.get('ffid'))
        flash('You deleted a Fish Fry ({0})'.format(ffid))

    return redirect(url_for('contribute'))

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
