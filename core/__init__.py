"""
core application module

initializes the Flask application, sets up the database, and provides access
to a few non-blueprinted routes.

"""

# ----------------------------------------------------------------------------
# IMPORTS

# standard library
import json
import uuid
# depedencies
from dateutil.parser import parse
from flask import Flask, render_template, redirect, request, url_for, flash, Markup
import flask_sqlalchemy
from marshmallow import pprint
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
from .api.db_interface import get_all_fishfries, get_one_fishfry, hide_one_fishfry, make_one_fishfry, update_one_fishfry
from .models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, Feature
from .forms import FishFryForm, EventForm, postprocess_events
from .forms import postprocess_boolean as ppb
from .utils import sort_records, handle_utc


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
    # return redirect(url_for('new_fishfry'))

#----------------------------------------------------------------------------
# Routes for editing fish frys

# empty form


@application.route('/new/')
# @login_required
def new_fishfry():
    """Empty Fish Fry Form
    """
    print("\nnew ----------")
    return render_template(
        'pages/fishfryform.html',
        form=FishFryForm(request.form)
    )


@application.route('/edit/', methods=['GET', 'POST'])
# @login_required
def load_fishfry():
    """gets a Fish Fry from the database using the Fish Fry id field,
    and loads it into the form for editing
    """
    print("\nedit ----------")
    ffid = request.args.get("ffid")
    if ffid:
        print(ffid, "\n")
        # Prepare the form
        ff = FishFryForm()
        # get data for the one fish fry
        onefry = get_one_fishfry(ffid)
        # shortcut to the returned fish fry's properties
        p = onefry['properties']
        # map the fish fry data to the form fields
        ff.ffid.data = ffid
        ff.alcohol.data = p['alcohol']
        ff.email.data = p['email']
        ff.etc.data = p['etc']
        ff.handicap.data = p['handicap']
        ff.homemade_pierogies.data = p['homemade_pierogies']
        ff.lunch.data = p['lunch']
        ff.menu_txt.data = p['menu']['text']
        ff.menu_url.data = p['menu']['url']
        ff.phone.data = p['phone']
        ff.publish.data = p['publish']
        ff.take_out.data = p['take_out']
        ff.validated.data = p['validated']
        ff.venue_address.data = p['venue_address']
        ff.venue_name.data = p['venue_name']
        ff.venue_notes.data = p['venue_notes']
        ff.venue_type.data = p['venue_type']
        ff.website.data = p['website']
        ff.lng.data = onefry['geometry']['coordinates'][0]
        ff.lat.data = onefry['geometry']['coordinates'][1]

        if p['events']:
            events = sort_records(p['events'], 'dt_start')
            for event in events:
                event_form = EventForm()
                event_form.dt_start = parse(event['dt_start'])
                event_form.dt_end = parse(event['dt_end'])
                ff.events.append_entry(event_form)

        return render_template(
            'pages/fishfryform.html',
            form=ff
        )
    else:
        print("could not edit. ffid not provided")
        return redirect(url_for('new_fishfry'))


# @application.route('/new/submit/', methods=['POST'])
# @application.route('/edit/submit/', methods=['POST'])
@application.route('/submit/', methods=['POST'])
#@login_required
def submit_fishfry():
    """endpoint for submitting a Fish Fry. Detects if Fish Fry is new or already exists.
    The new GeoJSON feature is submitted through this endpoint via a POST request.
    """
    print("\nsubmit ----------")
    # pdb.set_trace()
    error = None
    form = FishFryForm()
    # print(json.dumps(request.form, indent=2))
    # ffid = form['ffid']
    if form.validate_on_submit():

        # post-process the WTForm output and transform into schema

        # feature = postprocess_submit(request.form.to_dict())
        # print(json.dumps(feature, indent=2))
        # set up marshmallow schema
        ff = Feature()
        ff_props = FishFryProperties()
        ff_menu = FishFryMenu()
        ff_events = FishFryEvent()
        # map values...
        ff_props.email = form.email.data
        ff_props.etc = form.etc.data
        ff_props.publish = form.publish.data
        ff_props.validated = form.validated.data
        ff_props.venue_address = form.venue_address.data
        ff_props.venue_name = form.venue_name.data
        ff_props.venue_notes = form.venue_notes.data
        ff_props.venue_type = form.venue_type.data
        ff_props.phone = form.phone.data
        ff_props.website = form.website.data
        # boolean-eqsue selectors (need to be post-processed)
        ff_props.alcohol = ppb(form.alcohol.data)
        ff_props.handicap = ppb(form.handicap.data)
        ff_props.homemade_pierogies = ppb(form.homemade_pierogies.data)
        ff_props.lunch = ppb(form.lunch.data)
        ff_props.take_out = ppb(form.take_out.data)
        # nested properties
        ff_menu.text = form.menu_txt.data
        ff_menu.url = form.menu_url.data
        ff_props.events = postprocess_events(form.events.data)

        feature = Feature()
        feature.properties = ff_props
        feature.geometry = {
            "type": "Point",
            "coordinates": [form.lng.data, form.lat.data]
        }

        pprint(feature.dump(feature))

        # ----------------------------------------------------------------------
        # if there is an id already provided, then this is an existing
        # record, and we're doing an update.
        ffid = form.ffid.data
        print("ffid:", ffid, type(ffid))
        if ffid and ffid != "None":
            print("This is an existing record: {0}".format(ffid))

            # update_one_fishfry(ffid)

            flash('Fish Fry updated! {0}'.format(form.ffid.data), "info")
            return redirect(url_for('load_fishfry', ffid=form.ffid.data))

        # ----------------------------------------------------------------------
        # otherwise this is a new record. build that query
        else:
            print("This is a new record")

            # submit to the db
            # make_one_fishfry(
            #     properties=feature['properties'],
            #     geometry=feature['geometry'],
            #     strict=False
            # )

            # once the record is submitted, reload this page with the data.
            test_ffid = "another-new-fry"
            flash('Fish Fry added! {0}'.format(test_ffid), "info")
            return redirect(url_for('load_fishfry', ffid=test_ffid))
        # else:
        #     flash("Some required fields were not completed. See below.", "danger")
        #     return redirect(url_for('load_fishfry', ffid=ffid))
    print(json.dumps(form.errors, indent=2))
    # flash("You can only submit data through the form via POST request.<br>Consider using the API if you want to work with data programmatically.", "info")
    # return redirect(url_for('load_fishfry', ffid=ffid))
    return render_template(
        'pages/fishfryform.html',
        form=form,
        # ffid=ffid
    )


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
