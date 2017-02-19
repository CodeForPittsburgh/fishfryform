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
from datetime import datetime
from dateutil.parser import parse
from dateutil import tz

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

def handle_utc(datestring, direction="to_local"):
    """ parse from UTC to local when retrieving CARTO records.
    @param string datestring: ISO 8601 formatted datetime string
    
    Datetimes are stored in CARTO in UTC. When a dateime value is retrieved,
    it is returned as an ISO 8601 formatted datetime string with a 'Z'.
    
    Since (for now) we're concerned with Fish Fry in Western PA, we are assuming
    that users are giving us times for the Fish Frys in the Eastern Time Zone.
    So on the client-side, times will all be local time. Python will handle
    conversion from utc to local for use on the client-side.
    
    Coming back, if times have the UTC offset included, then they can be fed
    straight back into CARTO. .e.,g 2017-03-03T14:00:00-05:00 will show in the
    db as 2017-03-03T19:00:00Z.
    
    See these links for more info:
    http://stackoverflow.com/questions/4770297/python-convert-utc-datetime-string-to-local-datetime
    http://stackoverflow.com/questions/969285/how-do-i-translate-a-iso-8601-datetime-string-into-a-python-datetime-object
    """
    
    # METHOD 1: Hardcode zones:
    from_zone = tz.gettz('UTC')
    to_zone = tz.gettz('America/New_York')

    # METHOD 2: Auto-detect zones:
    #from_zone = tz.tzutc()
    #to_zone = tz.tzlocal()
    
    # parse the ISO 8601-formatted, UTC (zulu) string into a datetime object.
    # e.g., '2017-03-03T17:00:00Z'
    t = parse(datestring)
    
    
    if direction == "to_local" or direction == "from_utc": 
        # Tell the datetime object that it's in UTC time zone since 
        # datetime objects are 'naive' by default
        t = t.replace(tzinfo=from_zone)
        
        # Convert time zone
        tc = t.astimezone(to_zone)

        # return result as ISO 8601-formatted string, now with UTC offset
        # e.g., '2017-03-03T12:00:00-05:00'
        return tc.isoformat()
        
    elif direction == "to_utc" or direction == "from_local":
        
        t = t.replace(tzinfo=to_zone)
        
        # Convert time zone
        tc = t.astimezone(from_zone)
        
        return tc.isoformat()
    
    else:
        raise Exception
        print("incorrect datetime conversion direction string (must be 'to_utc' or 'to_local')")

def get_fishfrys_from_carto(ffid):
    """a helper function for making calls to the CARTO SQL API to get the
    fish frys and assemble the results from querying the two tables into one
    nested dictionary. Fish fry dates/times are nested into a single
    fish fry venue record.
    """
    #pdb.set_trace()
    # venues table: query and payload
    if ffid:
        fishfry_query = """SELECT * FROM fishfrymap WHERE cartodb_id = {0}""".format(ffid)
        fishfry_dt_query = """SELECT venue_key, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE venue_key = {0}""".format(ffid)
    else:
        fishfry_query = """SELECT * FROM fishfrymap"""
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
        fishfry_dt_query = """SELECT venue_key, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE venue_key in {0}""".format(str(tuple(fishfry_ids)))
    fishfry_dt_payload = {
        'q': fishfry_dt_query,
        'api_key': app.config['CARTO_SQL_API_KEY']
    }
    # submit request to CARTO SQL API
    fishfry_dt_json = requests.get(app.config['CARTO_SQL_API_URL'], params=fishfry_dt_payload).text
    # convert result json string to a dictionary
    fishfry_dt = json.loads(fishfry_dt_json)
    # redo that dict so we can use it more efficiently later (index it by venue key)
    # also take the opportunity to convert from utc to local time.
    fishfry_dt_by_id = {}
    for row in fishfry_dt['rows']:
        rid = row['venue_key']
        if rid in fishfry_dt_by_id:
            fishfry_dt_by_id[rid][row['cartodb_id']] = {'dt_start': handle_utc(row['dt_start']),'dt_end': handle_utc(row['dt_end'])}
            #fishfry_dt_by_id[rid][row['cartodb_id']] = {'dt_start': row['dt_start'],'dt_end': row['dt_end']}
        else:
            fishfry_dt_by_id[rid] = {row['cartodb_id'] : {'dt_start': handle_utc(row['dt_start']),'dt_end': handle_utc(row['dt_end'])}}
            #print({'dt_start': row['dt_start'],'dt_end': row['dt_end']})
        print(fishfry_dt_by_id)
    
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
            fishfry['properties']['events'] = {}
    
    return fishfrys

class dotdictify(dict):
    """
    makes a dictionary accessible via dot notation
    from http://stackoverflow.com/questions/3031219/python-recursively-access-dict-via-attributes-as-well-as-index-access
    also see http://stackoverflow.com/questions/2352181/how-to-use-a-dot-to-access-members-of-dictionary#32107024
    """
    marker = object()
    def __init__(self, value=None):
        if value is None:
            pass
        elif isinstance(value, dict):
            for key in value:
                self.__setitem__(key, value[key])
        else:
            raise TypeError, 'expected dict'

    def __setitem__(self, key, value):
        if isinstance(value, dict) and not isinstance(value, dotdictify):
            value = dotdictify(value)
        super(dotdictify, self).__setitem__(self, key, value)

    def __getitem__(self, key):
        found = self.get(key, dotdictify.marker)
        if found is dotdictify.marker:
            found = dotdictify()
            super(dotdictify, self).__setitem__(self, key, found)
        return found

    __setattr__ = __setitem__
    __getattr__ = __getitem__
    
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
    return render_template('pages/fishfrytable.html')

## empty form view
@app.route('/contribute/fishfry/')
#@login_required
def new_fishfry():
    return render_template('pages/fishfryform.html')

#@app.route('/contribute/fishfry/<int:ff_id>', methods=['GET'])
@app.route('/contribute/fishfry/<int:ff_id>', methods=['GET'])
#@login_required
def edit_fishfry(ff_id):
    #pdb.set_trace()
    fishfry = get_fishfrys_from_carto(ff_id)
    onefry = fishfry['features'][0]
    '''
    coordinates = fishfry[0]['geometry']['coordinates']
    properties = {}
    for k,v in fishfry[0]['properties'].iteritems():
        if k <> 'events':
            properties[k] = v
    events = fishfry[0]['properties']['events']
    '''
    
    #return make_response(jsonify(onefry), 200)
    print(onefry)
    
    return render_template(
        'pages/fishfryform.html',
        #ff = dotdictify(onefry)
        ff = json.dumps(onefry)
        )
    
    

# ---------------------------------------------------
# API
#
# This API provides the interface with the CARTO database, which is
# itself accessed through a web API that mimics SQL calls. See
# https://carto.com/docs/carto-engine/sql-api for more information.

## Get all Fish Fries
@app.route('/api/fishfrys', methods=['GET'])
@app.route('/api/fishfrys/', methods=['GET'])
def api_fishfries():
    """return all fish fries as geojson
    """
    fishfrys = get_fishfrys_from_carto(None)
    if fishfrys:
        code = 200
    else:
        code = 500
    return make_response(jsonify(fishfrys), code)

## Get a single existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['GET'])
@app.route('/api/fishfrys/<int:ff_id>/', methods=['GET'])
def api_fishfry(ff_id):
    """return a single fish fry as geojson using the id (primary key from db)
    """
    fishfrys = get_fishfrys_from_carto(ff_id)
    if fishfrys:
        code = 200
    else:
        code = 500
    return make_response(jsonify(fishfrys), code)

## Record a new Fish Fry
@app.route('/api/fishfrys', methods=['POST'])
def api_fishfry_new():
    ff = models.FishFryMap()
    '''
    # Not yet complete
    ff.write_new(
        cartodb_id=request.args['cartodb_id']
    )
    '''
    result = {"message": "creating a new fish fry through the API is not yet supported"}
    code = 405
    return make_response(jsonify(result), code)

##  Edit an existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['PUT'])
def api_fishfry_edit(ff_id):
    result = {"message": "editing an existing fish fry through the API is not yet supported"}
    code = 405
    return make_response(jsonify(result), code)

##  Remove an existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['DELETE'])
def api_fishfry_delete(ff_id):
    result = {"message": "removing a fish fry through the API is not yet supported"}
    code = 405
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

