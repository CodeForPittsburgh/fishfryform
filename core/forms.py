"""
forms.py

WTForms classes and related helper functions for getting data in/out of form 
renders or submits

"""

from flask_wtf import Form
from wtforms import PasswordField, StringField, TextField, SelectField, BooleanField, DateField, DateTimeField, TextAreaField, FieldList, FormField, FloatField
from wtforms.validators import DataRequired, EqualTo, Length, URL, Email

from dateutil.parser import parse


class RegisterForm(Form):
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


class LoginForm(Form):
    email = StringField('Username (E-mail)', [DataRequired()])
    password = PasswordField('Password', [DataRequired()])


class ForgotForm(Form):
    email = StringField(
        'Email', validators=[DataRequired(), Length(min=6, max=256)]
    )


boolean_choices = [
    ('Unsure / N/A', 'Unsure / N/A'),
    ('Yes', 'Yes'),
    ('No', 'No')
]


class EventTimeForm(Form):
    beg = DateTimeField(
        'Start time'
    )
    end = DateTimeField(
        'End time'
    )


class EventDateForm(Form):
    date = DateField(
        "Date",
        format='%m/%d/%Y'
    )
    events = FieldList(FormField(EventTimeForm))


class EventForm(Form):
    beg = DateTimeField(
        'Start time'
    )
    end = DateTimeField(
        'End time'
    )


class FishFryForm(Form):
    '''define formats of fields used to add tasks
    '''
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
            ('Restaurant', 'Restaurant'),
            ('Food Truck', 'Food Truck'),
            ('Other', 'Other')
        ]
    )
    venue_notes = TextAreaField('Notes about the facility', )
    website = StringField('Venue Website', validators=[URL()])
    email = StringField('E-Mail', validators=[Email()])
    phone = StringField('Phone')
    homemade_pierogies = SelectField(
        "Homemade Pierogies", choices=boolean_choices)
    lunch = SelectField("Lunch Served", choices=boolean_choices)
    handicap = SelectField("Handicap Accessible", choices=boolean_choices)
    take_out = SelectField("Take-Out Available", choices=boolean_choices)
    alcohol = SelectField("Alcohol Served", choices=boolean_choices)
    menu_url = StringField('URL to Menu', validators=[URL()])
    menu_txt = TextAreaField('Menu Text')
    etc = TextAreaField('Misc. Notes')
    publish = BooleanField("'Officially' Publish This Fish")
    validated = BooleanField("I've Validated This Fish Fry")
    # events = FieldList(StringField("Event"))
    events = FieldList(FormField(EventForm))
    lat = FloatField("Latitude (Y)")
    lat = FloatField("Longitude (X)")


def events_for_forms(events_array):
    """parse each event in the events array (from the database)
    into a ISO datetime range string, returning an array sorted oldest/newest.
    """
    events = [
        "{0}/{1}".format(e['dt_start'], e['dt_end']) for e in events_array
    ]
    events.sort()
    return events


def sort_records(recordset, sort_key):
    """sort a list of dictionary using the values from a common key

    Arguments:
        recordset {[list]} -- list of dictionaries
        sort_key {[str]} -- dictionary key on which data will be sorted

    Returns:
        [type] -- [description]
    """

    return sorted(recordset, key=lambda k: k[sort_key])


event_strf_plain = "%b %d %Y, %I:%M%p"
event_strf_techy = "%Y-%m-%d %I:%M%p"


def iso_dt_range_conversion(
    iso_dt_range_str,
    strf_str_start=event_strf_techy,
    strf_str_end=event_strf_techy,
    break_txt=" to "
):
    beg, end = tuple(iso_dt_range_str.split("/"))
    event_string = "{0}{2}{1}".format(
        parse(beg).strftime(strf_str_start),
        parse(end).strftime(strf_str_end),
        break_txt
    )
    return event_string
