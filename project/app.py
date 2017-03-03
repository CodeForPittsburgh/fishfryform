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
import uuid

#import pprint
#pp = pprint.PrettyPrinter(indent=2)

# dependencies
from flask import Flask, render_template, request, session, redirect, url_for, flash, send_from_directory, jsonify,  make_response
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from flask.ext.bcrypt import Bcrypt
from sqlalchemy.exc import IntegrityError

import pdb

# config
app = Flask(__name__)
app.config.from_pyfile('config.py')
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# in-app imports
from forms import ForgotForm, LoginForm, RegisterForm
import models

#----------------------------------------------------------------------------#
# Helper Functions & Wrappers
#----------------------------------------------------------------------------#

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

def get_fishfrys_from_carto(ffid,publish=None):
    """a helper function for making calls to the CARTO SQL API to get the
    fish frys and assemble the results from querying the two tables into one
    nested dictionary. Fish fry dates/times are nested into a single
    fish fry venue record.
    """
    #pdb.set_trace()
    
    # Initial call to fishfrymap table. Call 1 or all records depending on param
    if ffid:
        fishfry_query = """SELECT * FROM fishfrymap WHERE cartodb_id = {0}""".format(ffid)
        if publish == True:
            fishfry_query += """ AND publish = true AND validated = true"""
    else:
        fishfry_query = """SELECT * FROM fishfrymap"""
        if publish == True:
            fishfry_query += """ WHERE publish = true AND validated = true"""
    
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

    # for one record
    if ffid:
        # get the uuid from that one record
        fishfry_uuid = fishfrys['features'][0]['properties']['uuid']
        # build query
        fishfry_dt_query = """SELECT fishfry_uuid, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE fishfry_uuid = '{0}'""".format(fishfry_uuid)
    # for multiple records
    else:
        # get list of ids returned
        fishfry_ids = []
        for fishfry in fishfrys["features"]:
            fishfry_ids.append("""'{0}'""".format(fishfry["properties"]["uuid"]))
        fishfry_dt_query = """SELECT fishfry_uuid, dt_start, dt_end, cartodb_id FROM fishfry_dt WHERE fishfry_uuid in ({0})""".format(""", """.join(fishfry_ids))
    fishfry_dt_payload = {
        'q': fishfry_dt_query,
        'api_key': app.config['CARTO_SQL_API_KEY']
    }
    
    # submit request to CARTO SQL API
    fishfry_dt_json = requests.get(app.config['CARTO_SQL_API_URL'], params=fishfry_dt_payload).text
    # convert result json string to a dictionary
    fishfry_dt = json.loads(fishfry_dt_json)
    #print(fishfry_dt)
    
    # redo the resulting fishfry_dt dict so we can use it more efficiently later
    # (index it by ffid)
    # also take the opportunity to convert from utc to local time.
    fishfry_dt_by_id = {}
    for row in fishfry_dt['rows']:
        ffid = row['fishfry_uuid']
        if ffid in fishfry_dt_by_id:
            fishfry_dt_by_id[ffid][row['cartodb_id']] = {'dt_start': handle_utc(row['dt_start']),'dt_end': handle_utc(row['dt_end'])}
        else:
            fishfry_dt_by_id[ffid] = {row['cartodb_id'] : {'dt_start': handle_utc(row['dt_start']),'dt_end': handle_utc(row['dt_end'])}}
        #print(fishfry_dt_by_id)
    
    # for each record in the original fishfry table
    for fishfry in fishfrys['features']:
        # get the fish fry id (cartodb_id field)
        ffid = fishfry['properties']['uuid']
        # if id is in the datetimes dict, get datetime info and add it to a new
        # event property
        if ffid in fishfry_dt_by_id:
            fishfry['properties']['events'] = fishfry_dt_by_id[ffid]
        else:
            #otherwise, create the new event property but leave it empty.
            fishfry['properties']['events'] = {}
    
    return fishfrys
    

def sanitize(s):
    """functions for cleaning our strings before pushing them to SQL
    """
    s1 = s.replace("'","''")
    return s1
    '''
    if isinstance(s, unicode) or isinstance(s, str):
        #u2019
        s1 = s.decode("utf-8").replace(u"\u2019", "'").replace(u"\u2018", "'").replace(u"\u2022", "*").replace("'","''")
        return s1
    else:
        return s
    '''

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
    #return render_template('pages/map.html')
    return redirect("https://codeforpittsburgh.github.io/fishfrymap", code=302)

## data table view
@app.route('/contribute/')
#@login_required
def contribute():
    return render_template('pages/fishfrytable.html')

## empty form view
@app.route('/contribute/fishfry/')
@login_required
def new_fishfry():
    return render_template('pages/fishfryform.html')

#@app.route('/contribute/fishfry/<int:ff_id>', methods=['GET'])
@app.route('/contribute/fishfry/<int:ff_id>', methods=['GET'])
@login_required
def edit_fishfry(ff_id):
    """loads a Fish Fry from CARTO using the cartodb_id field
    """
    #pdb.set_trace()
    fishfry = get_fishfrys_from_carto(ff_id)
    onefry = fishfry['features'][0]
    #return make_response(jsonify(onefry), 200)
    #print(onefry)
    
    return render_template(
        'pages/fishfryform.html',
        #ff = dotdictify(onefry)
        ff = json.dumps(onefry)
        )

@app.route('/contribute/fishfry/submit', methods=['POST'])
@login_required
def submit_fishfry():
    #pdb.set_trace()
    error = None
    if request.method == 'POST':
        print("----------")
        # the submitted json is a string stored in an "ImmutableMultiDict"
        # (from werkzeug.datastructures import ImmutableMultiDict). Get it out
        # like this:
        #fishfry_json = request.form.items()[0][0]
        
        #print(request.form)
        #print(request.get_json())
        #print(request.get_json(force=True))
        
        fishfry_json = request.get_data()
        # then dump to a dictionary
        fishfry_dict = json.loads(fishfry_json)
        
        # ----------------------------------------------------------------------
        # do a quick check on the geometry and map publication options
        # we can't publish data submitted if the_geom is null
        if not fishfry_dict['the_geom']: 
            fishfry_dict['publish'] = False
        
        # ----------------------------------------------------------------------
        # assemble queries
        
        fishfry_query = None
        existing_dt_ids = None
        existing_dt_delete_query = None
        fishfry_dt_insert_query = None
        fishfry_getter_query = None
        new_fishfry_id = None
        
        # if there is a uuid already provided, then this is an existing
        # record, and we're doing an update.
        if fishfry_dict['uuid']:
            # ------------------------------------------------------------------
            # for the fishfryform table:
            # assemble key='value' strings for query
            kvpairs = []
            for k, v in fishfry_dict.iteritems():
                if k not in ('events', 'the_geom', 'cartodb_id', 'uuid'):
                    # we need Nones to be nulls for the SQL, as they were in json
                    if v in ("None","null","") or v is None:
                        kvpairs.append("""{0}=null""".format(k,v))
                    else:
                        kvpairs.append("""{0}='{1}'""".format(k,sanitize(v)))
                elif k == 'the_geom':
                    # if the_geom is empty, skip this part
                    if not fishfry_dict['the_geom']:
                        pass
                    # otherwise, build the PostGIS query
                    else:
                        kvpairs.append("""the_geom=ST_SetSRID(ST_Point({0},{1}),4326)""".format(fishfry_dict['the_geom']['coordinates'][0], fishfry_dict['the_geom']['coordinates'][1]))
            # assemble the query
            fishfry_query = """UPDATE fishfrymap SET {0} WHERE uuid = '{1}'""".format(str(", ").join(kvpairs), fishfry_dict['uuid'])
            print(fishfry_query)
            # submit the query
            fishfrymap_response = json.loads(requests.post(
                app.config['CARTO_SQL_API_URL'],
                params = {
                    'q': fishfry_query,
                    'api_key': app.config['CARTO_SQL_API_KEY'],
                }
            ).text)
            #print(fishfrymap_response)
            
            # ------------------------------------------------------------------
            # for the fishfry_dt table
            
            # get all existing/old records matching the fishfry_uuid, and get the cartodb_id
            existing_dt_query = """SELECT cartodb_id FROM fishfry_dt WHERE fishfry_uuid = '{0}'""".format(fishfry_dict['uuid'])
            #print(existing_dt_query)
            existing_dt = json.loads(requests.get(
                app.config['CARTO_SQL_API_URL'],
                params={'q': existing_dt_query, 'api_key': app.config['CARTO_SQL_API_KEY']}
            ).text)
            #existing_dt_ids = {"rows":[{"cartodb_id":2179},{"cartodb_id":1104},...]}
            existing_dt_ids = [x['cartodb_id'] for x in existing_dt['rows']]
            print(existing_dt_ids)
            # if existing_dt_ids was created, make a DELETE SQL query
            if len(existing_dt_ids) > 1:
                existing_dt_delete_query = """DELETE FROM fishfry_dt WHERE cartodb_id IN {0}""".format(str(tuple(existing_dt_ids)))
            elif len(existing_dt_ids) == 1:
                existing_dt_delete_query = """DELETE FROM fishfry_dt WHERE cartodb_id = {0}""".format(existing_dt_ids[0])
            else:
                existing_dt_delete_query = None
            
            # build the new dt insert query with the venue key
            # (but only if there are events)
            if len(fishfry_dict['events'].keys()) > 0:
                dtvs = []
                for k,v in fishfry_dict['events'].iteritems():
                    # assemble the value side of the query, using cartodb_id
                    dtvs.append("""('{0}', '{1}', '{2}')""".format(
                        v['dt_start'], v['dt_end'], fishfry_dict['uuid']))
                # insert the value side into the query for a multi-row insert
                # e.g., INSERT INTO tablename (column, column...) VALUES (row1_val1, row1_val2...), (row2_val1, row2_val2)..;
                fishfry_dt_insert_query = """INSERT INTO fishfry_dt (dt_start, dt_end, fishfry_uuid) VALUES {0}""".format(
                    str(", ").join(dtvs))
            #print(fishfry_dt_insert_query)
        
        # ----------------------------------------------------------------------
        # if there is no cartodb_id, then this is a new record. build that query
        else:
            #generate a uuid string for the new record
            new_fishfry_uuid = str(uuid.uuid4())
            # ------------------------------------------------------------------
            # for the fishfryform table:
            query_fields = []
            query_values = []
            for k, v in fishfry_dict.iteritems():
                if k not in ('cartodb_id', 'events','the_geom', 'uuid'):
                    query_fields.append(k)
                    if v in ("None","null","") or v is None:
                        query_values.append("""null""")
                    else:
                        query_values.append("""'{0}'""".format(sanitize(v)))
            
            # add that new uuid to the query
            query_fields.append('uuid')
            query_values.append("""'{0}'""".format(new_fishfry_uuid))
            
            # build-out query from lists; insert geometry query if the_geom exists
            if not fishfry_dict['the_geom']:
                fishfry_query = """INSERT INTO fishfrymap {0} VALUES {1}""".format(
                    """({0})""".format(""", """.join(query_fields)),
                    """({0})""".format(str(""", """).join(query_values))
                )              
            else:
                fishfry_query = """INSERT INTO fishfrymap {0} VALUES {1}""".format(
                    """({0}, the_geom)""".format(""", """.join(query_fields)),
                    """({0}, ST_SetSRID(ST_Point({1},{2}),4326))""".format(str(""", """).join(query_values), fishfry_dict['the_geom']['coordinates'][0], fishfry_dict['the_geom']['coordinates'][1])
                )
            print(fishfry_query)
            # run the query, inserting a new record
            fishfrymap_response = json.loads(requests.post(
                app.config['CARTO_SQL_API_URL'],
                params = {
                    'q': fishfry_query,
                    'api_key': app.config['CARTO_SQL_API_KEY'],
                }
            ).text)
                
            # ------------------------------------------------------------------
            # for the fishfry_dt table
            # Build the new query with the venue key (but only if there are events).
            # The fishfry_uuid is the uuid created for the fishfrymap table; it is
            # the link between that and the events table.
            if len(fishfry_dict['events'].keys()) > 0:
                dtvs = []
                for k,v in fishfry_dict['events'].iteritems():
                    # assemble the value side of the query
                    dtvs.append("""('{0}','{1}', '{2}')""".format(v['dt_start'], v['dt_end'], new_fishfry_uuid))
                # insert the value side into the query for a multi-row insert
                # e.g., INSERT INTO tablename (column, column...) VALUES (row1_val1, row1_val2...), (row2_val1, row2_val2)..;
                fishfry_dt_insert_query = """INSERT INTO fishfry_dt (dt_start, dt_end, fishfry_uuid) VALUES {0}""".format(str(", ").join(dtvs))
        
        # ----------------------------------------------------------------------
        # run queries on the fishfry_dt table, for either new or existing fish frys
        
        # assemble the query
        dt_queries = """; """.join([q for q in [fishfry_dt_insert_query, existing_dt_delete_query] if q is not None])
        print(dt_queries)
        if dt_queries:
            fishfry_dt_response = json.loads(requests.post(
                app.config['CARTO_SQL_API_URL'],
                params={
                'q': dt_queries,
                'api_key': app.config['CARTO_SQL_API_KEY'],
                }
            ).text)
        else:
            fishfry_dt_response = "no date/times"
        
        
        # ----------------------------------------------------------------------
        # combine status messages from both queries and return
        r = {
            "fishfrymap_response" : fishfrymap_response,
            "fishfry_dt_response": fishfry_dt_response
        }
        #print(r)
        
        if fishfry_dict['uuid']:
            #flash('Fish Fry updated!', 'success')
            return json.dumps({'redirect' : None, 'response':r})
        else:
            # run one more query to get the cartodb_id, so we can use it for redirect
            cartodb_id_response = json.loads(requests.get(
                app.config['CARTO_SQL_API_URL'],
                params={
                    'q': """SELECT cartodb_id FROM fishfrymap WHERE uuid = '{0}'""".format(new_fishfry_uuid),
                    'api_key': app.config['CARTO_SQL_API_KEY']
                }
            ).text)
            #existing_dt_ids = {"rows":[{"cartodb_id":2179},{"cartodb_id":1104},...]}
            cartodb_id = [x['cartodb_id'] for x in cartodb_id_response['rows']]
            #print(cartodb_id)
            
            #flash('New Fish Fry added!', 'success')
            # note that the redirect url_for includes the cartodb_id param
            return json.dumps({'redirect' : url_for('edit_fishfry', ff_id=cartodb_id[0]),'response':r})
    return render_template('pages/fishfrytable.html')
    

# ---------------------------------------------------
# API
#
# This API provides the interface with the CARTO database, which is
# itself accessed through a web API that mimics SQL calls. See
# https://carto.com/docs/carto-engine/sql-api for more information.

## Get all Fish Fries
@app.route('/api/fishfrys', methods=['GET'])
@app.route('/api/fishfrys/', methods=['GET'])
def api_fishfrys():
    """return all fish fries as geojson
    """
    # get them from CARTO into a dictionary
    if request.args:
        # if optional request argument publish is provided
        if request.args['publish'] in ('true', 'True'):
            fishfrys = get_fishfrys_from_carto(None,True)
        else:
            fishfrys = get_fishfrys_from_carto(None,False)
    else:
        fishfrys = get_fishfrys_from_carto(None)

    if fishfrys:
        response = fishfrys
        status = 200
    else:
        response = {"error":"CARTO did return any data"}
        status  = 500
    r = make_response(jsonify(fishfrys), status)
    # add header to enable CORS
    r.headers['Access-Control-Allow-Origin'] = '*'
    return make_response(r)

## Get a single existing Fish Fry
@app.route('/api/fishfrys/<int:ff_id>', methods=['GET'])
@app.route('/api/fishfrys/<int:ff_id>/', methods=['GET'])
def api_fishfry(ff_id):
    """return a single fish fry as geojson using the id (primary key from db)
    """
    fishfrys = get_fishfrys_from_carto(ff_id,None)
    if fishfrys:
        status = 200
    else:
        status = 500
    r = make_response(jsonify(fishfrys), status)
    # add header to enable CORS
    r.headers['Access-Control-Allow-Origin'] = '*'
    return make_response(r)

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
            user = models.User.query.filter_by(email=request.form['email']).first()
            #user = user_loader(request.form['email'])
            if user is not None and bcrypt.check_password_hash(user.password, request.form['password']):
                session['logged_in'] = True
                session['user_id'] = user.email
                session['role'] = user.role
                flash('Welcome!','success')
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
                bcrypt.generate_password_hash(form.password.data)
            )
            try:
                db.session.add(new_user)
                db.session.commit()
                flash('Thanks for registering. Please login.')
                return redirect(url_for('login'))
            except IntegrityError:
                error = 'That username / email already exists.'
                return render_template('register.html', form=form, error=error)
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
    session.pop('role', None)
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

