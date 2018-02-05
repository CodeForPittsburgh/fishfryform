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
from dateutil.parser import parse
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
from .forms import FishFryForm, EventForm, sort_records


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


@application.route('/new/')
# @login_required
def new_fishfry():
    """Empty Fish Fry Form
    """
    return render_template(
        'pages/fishfryform.html',
        form=FishFryForm(request.form),
        ffid=""
    )


@application.route('/edit/', methods=['GET', 'POST'])
# @login_required
def load_fishfry():
    """gets a Fish Fry from the database using the Fish Fry id field,
    and loads it into the form for editing
    """
    ffid = request.args.get("ffid")
    if ffid:
        # Prepare the form
        fish_fry_form = FishFryForm()
        # get data for the one fish fry
        onefry = get_one_fishfry(ffid)
        # shortcut to the returned fish fry's properties
        p = onefry['properties']
        # map the fish fry data to the form fields
        fish_fry_form.alcohol.data = p['alcohol']
        fish_fry_form.email.data = p['email']
        fish_fry_form.etc.data = p['etc']
        fish_fry_form.handicap.data = p['handicap']
        fish_fry_form.homemade_pierogies.data = p['homemade_pierogies']
        fish_fry_form.lunch.data = p['lunch']
        fish_fry_form.menu_txt.data = p['menu']['text']
        fish_fry_form.menu_url.data = p['menu']['url']
        fish_fry_form.phone.data = p['phone']
        fish_fry_form.publish.data = p['publish']
        fish_fry_form.take_out.data = p['take_out']
        fish_fry_form.validated.data = p['validated']
        fish_fry_form.venue_address.data = p['venue_address']
        fish_fry_form.venue_name.data = p['venue_name']
        fish_fry_form.venue_notes.data = p['venue_notes']
        fish_fry_form.venue_type.data = p['venue_type']
        fish_fry_form.website.data = p['website']
        print(onefry['geometry']['coordinates'])
        fish_fry_form.lng.data = onefry['geometry']['coordinates'][0]
        fish_fry_form.lat.data = onefry['geometry']['coordinates'][1]

        if p['events']:
            events = sort_records(p['events'], 'dt_start')
            for event in events:
                event_form = EventForm()
                event_form.dt_start = parse(event['dt_start'])
                event_form.dt_end = parse(event['dt_end'])
                fish_fry_form.events.append_entry(event_form)

        return render_template(
            'pages/fishfryform.html',
            form=fish_fry_form,
            ffid=ffid
        )
    else:
        return redirect(url_for('new_fishfry'))


@application.route('/submit/', methods=['POST'])
#@login_required
def submit_fishfry():
    """endpoint for submitting a Fish Fry. Detects if Fish Fry is new or already exists.
    The new GeoJSON feature is submitted through this endpoint via a POST request.
    """
    # pdb.set_trace()
    error = None
    fishfry_json = request.get_data()
    print(repr(fishfry_json))
    return None
    '''
    if request.method == 'POST':
        print("----------\n")

        fishfry_json = request.get_data()
        # then dump to a dictionary
        # fishfry_dict = json.loads(fishfry_json)
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

            # return json.dumps({'redirect': None, 'response': ''})

        # ----------------------------------------------------------------------
        # if there is no cartodb_id, then this is a new record. build that query
        else:
            print("New record")
            # run the query, inserting a new record

            # we need to make or get the new id...

            # once the record is submitted, reload this page with the data.
            # return json.dumps({'redirect': url_for('edit_fishfry', ffid=fishfry_dict['ffid']), 'response': ''})

    # return render_template('pages/fishfrytable.html')
    '''


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
    # Error handler 500
    """
    return render_template('errors/500.html'), 500


@application.errorhandler(404)
def not_found_error(error):
    """
    # Error handler 404
    """
    return render_template('errors/404.html'), 404
