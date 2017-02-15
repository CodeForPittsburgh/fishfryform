#----------------------------------------------------------------------------#
# APP CONFIGURATION
#----------------------------------------------------------------------------#

# standard library imports
import os
import logging
from logging import Formatter, FileHandler
from functools import wraps
import requests
import json

# dependencies
from flask import Flask, render_template, request, session, redirect, url_for, flash, send_from_directory, jsonify,  make_response
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, current_user, login_required

import pdb

# config
app = Flask(__name__)
app.config.from_pyfile('config.py')
db = SQLAlchemy(app)

# in-app imports
from forms import ForgotForm, LoginForm, RegisterForm
import models

#----------------------------------------------------------------------------#
# Helper Functions & Wrappers
#----------------------------------------------------------------------------#

# Automatically tear down SQLAlchemy
'''
@app.teardown_request
def shutdown_session(exception=None):
    db_session.remove()
'''


# load login manager
login_manager = LoginManager()
login_manager.init_app(app)

# Login required decorator

def login_required(test):
    @wraps(test)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return test(*args, **kwargs)
        else:
            flash('You need to login first.')
            return redirect(url_for('login'))
    return wrap

@login_manager.user_loader
def user_loader(user_id):
    """Given *user_id*, return the associated User object.
    @param unicode user_id: user_id (email) user to retrieve.
    """
    return models.User.query.get(user_id)

#----------------------------------------------------------------------------#
# Controllers / Route Handlers
#----------------------------------------------------------------------------#

# ---------------------------------------------------
# pages (rendered from templates)

## home page
@app.route('/home/')
@app.route('/index/')
@app.route('/')
def home():
    return render_template('pages/home.html')

## map view
@app.route('/map/')
#@login_required
def map():
    return render_template('pages/map.html')

## data table view
@app.route('/contribute/')
#@login_required
def contribute():
    return render_template('pages/contribute.html')

## data form view
@app.route('/contribute/form/')
#@login_required
def dataform():
    return render_template('pages/dataform.html')

# ---------------------------------------------------
# API Routes
#
# This API provides the interface with the CARTO database, which is
# itself accessed through a web API.

def get_fishfrys_from_carto(ffid):
    """a helper function for making calls to the CARTO SQL API to get the
    fish frys and assemble the results from querying the two tables into one
    nested dictionary. Fish fry dates/times are nested into a single
    fish fry venue record.
    """
    #pdb.set_trace()
    # venues table: query and payload
    if ffid:
        fishfry_query = 'SELECT * FROM fishfrymap WHERE cartodb_id = {0}'.format(ffid)
        fishfry_dt_query = 'SELECT venue_key, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE venue_key = {0}'.format(ffid)
    else:
        fishfry_query = 'SELECT * FROM fishfrymap'
    venue_payload = {
        'q': fishfry_query,
        'api_key': app.config['CARTO_SQL_API_KEY'],
        'format':'GeoJSON'
    }
    # submit request to CARTO SQL API
    fishfry_json = requests.get(app.config['CARTO_SQL_API_URL'], params=venue_payload).text
    # convert result to a dictionary
    fishfrys = json.loads(fishfry_json)
    
    # get relevant records from fishfry datetimes table
    # (we do this separately because we want our results to be a multi-dim array)
    if not ffid:
        # get list of ids returned
        fishfry_ids = []
        for fishfry in fishfrys["features"]:
            fishfry_ids.append(fishfry["properties"]["cartodb_id"])
        fishfry_dt_query = 'SELECT venue_key, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE venue_key in {0}'.format(str(tuple(fishfry_ids)))
    fishfry_dt_payload = {
        'q': fishfry_dt_query,
        'api_key': app.config['CARTO_SQL_API_KEY']
    }
    # submit request to CARTO SQL API
    fishfry_json = requests.get(app.config['CARTO_SQL_API_URL'], params=fishfry_dt_payload).text
    # convert result json string to a dictionary
    fishfry_dt = json.loads(fishfry_json)
    # redo that dict so we can use it more efficiently later (index it venue key)
    fishfry_dt_by_id = {}
    for row in fishfry_dt['rows']:
        rid = row['venue_key']
        if rid in fishfry_dt_by_id:
            fishfry_dt_by_id[rid].append({'dt_start': row['dt_start'],'dt_end': row['dt_end'],'dt_id': row['cartodb_id']})
        else:
            fishfry_dt_by_id[rid] = [{'dt_start': row['dt_start'],'dt_end': row['dt_end'],'dt_id': row['cartodb_id']}]
    
    # for each record in the original fishfry table
    for fishfry in fishfrys['features']:
        # get the fish fry id (cartodb_id field)
        ffid = fishfry['properties']['cartodb_id']
        # if id is in the datetimes dict, get datetime info and add it to a new
        # event property
        if ffid in fishfry_dt_by_id:
            fishfry['properties']['events'] = fishfry_dt_by_id[ffid]
        else:
            #otherwise, create the new event property but leave it empty.
            fishfry['properties']['events'] = []
    
    return fishfrys

## Get all Fish Fries
@app.route('/api/fishfrys', methods=['GET'])
def api_fishfries():
    """this route returns all fish fries
    """
    fishfrys = get_fishfrys_from_carto(None)
    if fishfrys:
        code = 200
    else:
        code = 500
    return make_response(jsonify(fishfrys), code)

## Get an existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['GET'])
def api_fishfry(ff_id):
    fishfrys = get_fishfrys_from_carto(ff_id)
    if fishfrys:
        code = 200
    else:
        code = 500
    return make_response(jsonify(fishfrys), code)

## Record a new Fish Fry
@app.route('/api/fishfrys', methods=['POST'])
def api_fishfry_new():
    result = {"new": request.args}
    code = 200
    return make_response(jsonify(result), code)

##  Edit an existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['PUT'])
def api_fishfry_edit(ff_id):
    result = {"edit": ff_id, "params": request.args}
    code = 200
    return make_response(jsonify(result), code)

##  Remove an existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['DELETE'])
def api_fishfry_delete(ff_id):
    result = {"delete": ff_id}
    code = 200
    return make_response(jsonify(result), code)


# ---------------------------------------------------
# pages for authentication

## login
@app.route('/login/', methods=['GET','POST'])
def login():
    error = None
    form = LoginForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            #user = models.User.query.filter_by(name=request.form['name']).first()
            user = user_loader(request.form['email'])
            if user is not None and user.password == request.form['password']:
                session['logged_in'] = True
                session['user_id'] = user.email
                flash('Welcome {}!'.format(user.email),'success')
                return redirect(url_for('home'))
            else:
                error = 'Invalid credentials. Please try again.'
                flash(error, 'warning')
        else:
            error = 'User and password not provided. Please try again.'
            flash(error, 'warning')
    return render_template('forms/login.html', form=form)

@app.route('/register/', methods=['GET','POST'])
def register():
    error = None
    form = RegisterForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            new_user = User(
                form.email.data,
                form.password.data
            )
            db.session.add(new_user)
            db.session.commit()
            flash('Thanks for registering. Please login.')
            return redirect(url_for('login'))
    return render_template('forms/register.html', form=form, error=error)

@app.route('/forgot/')
def forgot():
    form = ForgotForm(request.form)
    return render_template('includes/forgot.html', form=form)


# ------------------------------------------------
# application logic (no page rendered)

## Logout - ends session for user, redirects to login
@app.route('/logout/')
def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None)
    flash('You are logged out.')
    return redirect(url_for('home'))

## DATA
@app.route('/data/<path:path>')
@login_required
def send_data(path):
    return send_from_directory('data', path)


# ------------------------------------------------
# Error Handling

## Error handler 500
@app.errorhandler(500)
def internal_error(error):
    #db_session.rollback()
    return render_template('errors/500.html'), 500

## Error handler 404
@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

## Error Logging
if not app.debug:
    file_handler = FileHandler('error.log')
    file_handler.setFormatter(
        Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
    )
    app.logger.setLevel(logging.INFO)
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.info('errors')

