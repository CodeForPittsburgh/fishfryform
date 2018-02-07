"""
forms.py

WTForms classes and related helper functions for getting data in/out of form 
renders or submits

"""

from flask_wtf import FlaskForm
from wtforms import Form as WTForm  # use for form within field list
from wtforms import PasswordField, StringField, TextField, SelectField, BooleanField, TextAreaField, FieldList, FormField, FloatField
from wtforms.ext.dateutil.fields import DateTimeField, DateField
from wtforms.validators import DataRequired, EqualTo, Length, URL, Email, Optional
from dateutil.parser import parse
from .utils import handle_utc
import json


class RegisterForm(FlaskForm):
    '''define formats of fields used to add
    '''
    email = StringField(
        'Email',
        validators=[DataRequired(), Length(min=6, max=40)]
    )
    password = PasswordField(
        'Password',
        validators=[DataRequired(), Length(min=8, max=256)]
    )
    confirm = PasswordField(
        'Repeat Password',
        [DataRequired(), EqualTo('password', message='Passwords must match')]
    )


class LoginForm(FlaskForm):
    email = StringField('Username (E-mail)', [DataRequired()])
    password = PasswordField('Password', [DataRequired()])


class ForgotForm(FlaskForm):
    email = StringField(
        'Email', validators=[DataRequired(), Length(min=6, max=256)]
    )


boolean_choices = [
    ('Unsure / N/A', 'Unsure / N/A'),
    ('Yes', 'Yes'),
    ('No', 'No')
]


class EventForm(WTForm):
    dt_start = DateTimeField('Start')
    dt_end = DateTimeField('End')


class FishFryForm(FlaskForm):
    '''define formats of fields used to add tasks
    '''
    ffid = StringField()
    venue_name = StringField(label='Venue (or Event) Name',
                             validators=[DataRequired()])
    venue_address = StringField(label='Venue Address',
                                validators=[DataRequired()])
    venue_type = SelectField(
        'Venue Type',
        choices=[
            ('Unsure / N/A', 'Unsure / N/A'),
            ('Church', 'Church'),
            ('Fire Department', 'Fire Department'),
            ('Community Organization', 'Community Organization'),
            ('VFW', 'VFW'),
            ('Market', 'Market'),
            ('Food Truck', 'Food Truck'),
            ('Restaurant', 'Restaurant'),
            ('Other', 'Other')
        ]
    )
    venue_notes = TextAreaField('Notes about the facility', )
    website = StringField('Venue Website')  # , validators=[Optional(), URL()])
    email = StringField('E-Mail')  # , validators=[Optional(), Email()])
    phone = StringField('Phone')
    homemade_pierogies = SelectField(
        "Homemade Pierogies", choices=boolean_choices)
    lunch = SelectField("Lunch Served", choices=boolean_choices)
    handicap = SelectField("Handicap Accessible", choices=boolean_choices)
    take_out = SelectField("Take-Out Available", choices=boolean_choices)
    alcohol = SelectField("Alcohol Served", choices=boolean_choices)
    menu_url = StringField('URL to Menu')  # , validators=[Optional(), URL()])
    menu_txt = TextAreaField('Menu Text')
    etc = TextAreaField('Misc. Notes')
    publish = BooleanField("Published")
    validated = BooleanField("Validated")
    # publish = SelectField(
    #     "'Officially' Publish This Fish Fry", choices=[("No", "No"), ("Yes", "Yes")])
    # validated = SelectField(
    #     "I've Validated This Fish Fry", choices=[("No", "No"), ("Yes", "Yes")])
    # events = FieldList(StringField("Event"))
    events = FieldList(FormField(EventForm))
    lat = FloatField("Lat (Y)")
    lng = FloatField("Lng (X)")


boollookup_from_form = {
    'Unsure / N/A': None,
    'Yes': True,
    'No': False
}
boollookup_to_form = {
    None: 'Unsure / N/A',
    True: 'Yes',
    False: 'No'
}


def postprocess_boolean(value, bool_lookup=boollookup_from_form):
    if value in bool_lookup.keys():
        return bool_lookup[value]
    else:
        return None


def preprocess_boolean(value):
    if value == True:
        return 'Yes'
    elif value == False:
        return 'No'
    else:
        return 'Unsure / N/A'


def postprocess_events(form_events_data):
    a = []
    for e in form_events_data:
        d = {}
        for k, v in e.items():
            dt = v.isoformat()
            d[k] = dt
        a.append(d)
    return a


def postprocess_raw_events(
    form_dict,  # events?
    event_prefix="events-",
    event_brk="-",
    event_sort="dt_start",
    time_dir="to_utc"
):
    """(unfortunately) we need to do a lot of postprocessing from the form to 
    match the geojson spec utilized by the database. This function does that.
    """
    ff = form_dict
    prefix = event_prefix
    break_val = event_brk
    sort_key = event_sort

    # get only the items that represente events
    times = [{k: v} for k, v in ff.items() if prefix in k]

    # parse those into pairs; keep track of what we parsed because we
    # will clean up the original, later

    if times:
        keys_to_pop = []
        event_data = {}
        for t in times:
            k = list(t.keys())[0]
            keys_to_pop.append(k)
            v = handle_utc(t[k], time_dir)
            brk = k.strip(prefix).find(break_val)
            suffix = k.lstrip(prefix)
            uid = str(suffix[:brk])
            etype = suffix[brk+1:]
            # print(suffix, uid, etype, v)
            if uid in event_data.keys():
                event_data[uid].update({etype: v})
            else:
                event_data[uid] = {etype: v}
        # now that we have our start/end pairs grouped, form the events array
        event_array = [v for k, v in event_data.items()]
        events = sorted(event_array, key=lambda k: k[sort_key])
        return events
    else:
        return []


def postprocess_submit(
    form_dict,
    event_prefix="events-",
    event_brk="-",
    event_sort="dt_start",
    time_dir="to_utc",
    bool_fields=[
        "homemade_pierogies",
        "lunch",
        "take_out",
        "handicap",
        "alcohol"
    ],
    bool_lookup={
        'Unsure / N/A': None,
        'Yes': True,
        'No': False
    }
):
    """(unfortunately) we need to do a lot of postprocessing from the form to 
    match the geojson spec utilized by the database. This function does that.
    """
    ff = form_dict
    prefix = event_prefix
    break_val = event_brk
    sort_key = event_sort

    # get only the items that represente events
    times = [{k: v} for k, v in ff.items() if prefix in k]

    # parse those into pairs; keep track of what we parsed because we
    # will clean up the original, later

    if times:
        keys_to_pop = []
        event_data = {}
        for t in times:
            k = list(t.keys())[0]
            keys_to_pop.append(k)
            v = handle_utc(t[k], time_dir)
            brk = k.strip(prefix).find(break_val)
            suffix = k.lstrip(prefix)
            uid = str(suffix[:brk])
            etype = suffix[brk+1:]
            # print(suffix, uid, etype, v)
            if uid in event_data.keys():
                event_data[uid].update({etype: v})
            else:
                event_data[uid] = {etype: v}
        # now that we have our start/end pairs grouped, form the events array
        event_array = [v for k, v in event_data.items()]
        events = sorted(event_array, key=lambda k: k[sort_key])
        # for e in sorted_events:
        #     print(e)

        # remove event keys from the original
        properties = {k: v for k, v in ff.items() if k not in keys_to_pop}
        # add in the events array
        properties['events'] = events
    else:
        properties = {}
        properties['events'] = []

    # post process the menu data
    menu_url = properties.pop('menu_url')
    menu_txt = properties.pop('menu_txt')
    properties['menu'] = {
        "url": menu_url,
        "text": menu_txt
    }

    # post process the boolean data
    for b in bool_fields:
        if properties[b] in bool_lookup.keys():
            properties[b] = bool_lookup[properties[b]]
        else:
            properties[b] = None

    # post process geometry data
    lat = properties.pop('lat')
    lng = properties.pop('lng')
    geometry = {
        "type": "Point",
        "coordinates": [lng, lat]
    }

    # build the feature
    feature = {
        "properties": properties,
        "geometry": geometry,
        "type": "feature"
    }
    return feature
