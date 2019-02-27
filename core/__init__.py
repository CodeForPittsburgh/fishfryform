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
import logging
# depedencies
from dateutil.parser import parse
from flask import Flask, render_template, redirect, request, url_for, flash, Markup, session
import flask_sqlalchemy
from marshmallow import pprint, ValidationError
# application
from flask_dynamo import Dynamo
from flask_security import login_required, current_user, roles_required
from flask_mail import Mail
from flask_jsglue import JSGlue
from flask_cors import CORS, cross_origin

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
# Setup Flask-Mail
mail = Mail(application)
# Enable CORS on select routes.
cors = CORS(application, resources={r"/api/*": {"origins": "*"}})
logging.getLogger('flask_cors').level = logging.ERROR

# application imports (these use the Flask "application" object, so get imported here)
from .admin import admin_blueprint
from .api import api_blueprint
from .api.db_interface import get_all_fishfries, get_one_fishfry, hide_one_fishfry, make_one_fishfry, update_one_fishfry, delete_one_fishfry
from .api.db_interface import record_stat, get_stats
from .models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, Feature
from .models import User
from .forms import FishFryForm, EventForm, postprocess_events
from .forms import postprocess_boolean as postbool
from .forms import preprocess_boolean as prebool
from .utils import sort_records, handle_utc

#----------------------------------------------------------------------------
# Helpers

def get_user_info(user_id_from_session):
    return User.query.filter(User.id == user_id_from_session).first()
    
def record_stats(ffid, what):
    if application.config['LEADERBOARD_ON']:
        # u = get_user_info(session['user_id'])
        record_stat(str(current_user), ffid, what)

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
@login_required
def new_fishfry():
    """Empty Fish Fry Form
    """
    logging.info("\nnew ----------")
    return render_template(
        'pages/fishfryform.html',
        form=FishFryForm(request.form)
    )


@application.route('/edit/', methods=['GET', 'POST'])
@login_required
def load_fishfry():
    """gets a Fish Fry from the database using the Fish Fry id field,
    and loads it into the form for editing
    """
    logging.info("\nedit ----------")
    ffid = request.args.get("ffid")
    if ffid:
        logging.info(ffid)
        # Prepare the form
        ff = FishFryForm()
        # get data for the one fish fry
        onefry = get_one_fishfry(ffid)
        # shortcut to the returned fish fry's properties
        if 'properties' in onefry.keys():
            p = onefry['properties']
            # map the fish fry data to the form fields
            ff.ffid.data = ffid
            ff.alcohol.data = prebool(p['alcohol'])
            ff.email.data = p['email']
            ff.etc.data = p['etc']
            ff.handicap.data = prebool(p['handicap'])
            ff.homemade_pierogies.data = prebool(p['homemade_pierogies'])
            ff.lunch.data = prebool(p['lunch'])
            ff.menu_txt.data = p['menu']['text']
            ff.menu_url.data = p['menu']['url']
            ff.phone.data = p['phone']
            ff.publish.data = p['publish']
            ff.take_out.data = prebool(p['take_out'])
            ff.validated.data = p['validated']
            ff.venue_address.data = p['venue_address']
            ff.venue_name.data = p['venue_name']
            ff.venue_notes.data = p['venue_notes']
            ff.venue_type.data = p['venue_type']
            ff.website.data = p['website']
            try:
                ff.lng.data = onefry['geometry']['coordinates'][0]
                ff.lat.data = onefry['geometry']['coordinates'][1]
            except:
                logging.warning("bad geom for {0}".format(ffid))
                ff.lng.data = None
                ff.lat.data = None
            logging.info(p['events'])

            # only include complete event records.
            checked_events = [e for e in p['events'] if e['dt_start'] and e['dt_end']]
            if checked_events:
                events = sort_records(checked_events, 'dt_start')
                for event in events:
                    event_form = EventForm()
                    event_form.dt_start = parse(event['dt_start'])
                    event_form.dt_end = parse(event['dt_end'])
                    ff.events.append_entry(event_form)
            # logging.info(ff.alcohol.data)
            # logging.info(ff.validated.data)
            return render_template(
                'pages/fishfryform.html',
                form=ff
            )
        else:
            msg = "Requested fish fry ({0}) not found.".format(ffid)
            logging.warning(msg)
            flash(msg, "warning")
            return redirect(url_for('new_fishfry'))
    else:
        msg = "Fish Fry ID not provided, so editing not possible. Record a new fish fry."
        logging.info(msg)
        flash(msg, "info")
        return redirect(url_for('new_fishfry'))


# @application.route('/new/submit/', methods=['POST'])
# @application.route('/edit/submit/', methods=['POST'])
@application.route('/submit/', methods=['POST'])
@login_required
def submit_fishfry():
    """endpoint used by form to submit a Fish Fry. Detects if Fish Fry is new or already exists.
    The Fish Fry feature is submitted through this endpoint via a POST request.
    """
    logging.info("\nsubmit ----------")
    # pdb.set_trace()
    form = FishFryForm()
    # logging.info(json.dumps(request.form, indent=2))
    # ffid = form['ffid']
    if form.validate_on_submit():

        # ---------------------------------------------------------------------
        # get the form data and plug it into the geojson.
        # some of that data requires post-processing; that is done here.

        # feature_dict = postprocess_submit(request.form.to_dict())

        properties = {
            "venue_name": form.venue_name.data,
            "venue_address": form.venue_address.data,
            "venue_type": form.venue_type.data,
            "venue_notes": form.venue_notes.data,
            "website": form.website.data,
            "email": form.email.data,
            "phone": form.phone.data,
            "etc": form.etc.data,
            "handicap": postbool(form.handicap.data),
            "alcohol": postbool(form.alcohol.data),
            "homemade_pierogies": postbool(form.homemade_pierogies.data),
            "lunch": postbool(form.lunch.data),
            "take_out": postbool(form.take_out.data),
            "validated": form.validated.data,
            "publish": form.publish.data,
            "menu": {
                "text": form.menu_txt.data,
                "url": form.menu_url.data
            },
            "events": postprocess_events(form.events.data)
        }
        geometry = {
            "type": "Point",
            "coordinates": [form.lng.data, form.lat.data]
        }

        feature = {
            "type": "Feature",
            "properties": properties,
            "geometry": geometry
        }

        logging.info(json.dumps(feature, indent=2))

        # OPTOINAL: validate with Marshmallow here
        # (WTForms is also providing validation)
        # try:
        #     result = Feature().load(feature)
        # except ValidationError as err:
        #     logging.warning(err.messages)
        #     logging.warning(err.data)

        # ---------------------------------------------------------------------
        # if there is an id already provided by the form, then this is an
        # existing record, and we're doing an update.
        ffid = form.ffid.data
        if ffid and ffid != "None":
            logging.info("This is an existing record ({0})".format(ffid))
            onefry = update_one_fishfry(
                ffid,
                properties,
                geometry
            )
            logging.info(json.dumps(onefry, indent=2))
            if 'id' in onefry.keys():
                ffid = onefry['id']
                # run the record_stats helper, which handles
                # edit logging and is controlled by 
                record_stats(ffid, 'update')
                flash('Fish Fry updated! ({0})'.format(ffid), "info")
                return redirect(url_for('load_fishfry', ffid=ffid))

        # ----------------------------------------------------------------------
        # Otherwise this is a new record. An FFID will be assigned
        # closer to the metal.
        else:
            logging.info("This is a new record")

            # submit to the db
            onefry = make_one_fishfry(
                properties=properties,
                geometry=geometry
            )
            if 'id' in onefry.keys():
                ffid = onefry['id']
                record_stats(ffid, 'add')
                # once the record create is submitted, reload this page with the data.
                flash('Fish Fry added! ({0})'.format(ffid), "success")
                return redirect(url_for('load_fishfry', ffid=ffid))
            else:
                flash(
                    "There was an 500-level error when adding data to the database.", "danger")
                return render_template(
                    'pages/fishfryform.html',
                    form=form,
                )
    # flash("Invalid data:\n"{0}.format("\n".join([error for error in form.errors])))
    # flash("You can only submit data through the form via POST request.<br>Consider using the API if you want to work with data programmatically.", "info")
    # return redirect(url_for('load_fishfry', ffid=ffid))
    return render_template(
        'pages/fishfryform.html',
        form=form
    )


@application.route('/delete/', methods=['POST'])
@login_required
@roles_required('admin')
def delete_fishfry():
    """deletes a Fish Fry
    This route is called from the form page, and redirects to the contribute page.
    """
    if request.method == 'POST' and request.args.get('ffid'):
        ffid = request.args.get('ffid')
        r = delete_one_fishfry(ffid)
        if r:
            record_stats(ffid, 'delete')
        try:
            flash(r['message'], 'info')
        except:
            flash("There may have been an error deleting the record", 'warning')

    return redirect(url_for('contribute'))


@application.route('/hide/', methods=['POST'])
@login_required
def hide_fishfry():
    """just turns off validation and publication, so we don't see it.
    """
    if request.method == 'POST' and request.args.get('ffid'):
        ffid = request.args.get('ffid')
        r = hide_one_fishfry(ffid)
        if r:
            record_stats(ffid, 'hide')
        flash('You un-published a Fish Fry ({0})'.format(ffid), 'info')

    return redirect(url_for('load_fishfry', ffid=ffid))


#----------------------------------------------------------------------------
# Route for the leaderboard

# @application.route('/leaderboard/<dt_start>/', methods=['GET'])
# @application.route('/leaderboard/<dt_start>/<dt_end>', methods=['GET'])
@application.route('/leaderboard/', methods=['GET'])
@login_required
def view_leaderboard():
    dt_start, dt_end = None, None
    dt_start = request.args.get("after")
    dt_end = request.args.get("before")
    print(dt_start, dt_end)
    stats = get_stats(after_when=dt_start, before_when=dt_end)
    stats_json = json.dumps(stats)
    return render_template(
        'pages/leaderboard.html',
        dt_start=dt_start,
        dt_end=dt_end,
        summaryChartData=stats_json
    )

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
