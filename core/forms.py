"""
forms.py

WTForms classes and related helper functions for getting data in/out of form 
renders or submits

"""

from flask_wtf import FlaskForm
from wtforms import PasswordField, StringField, TextField, SelectField, BooleanField, TextAreaField, FieldList, FormField, FloatField
from wtforms.ext.dateutil.fields import DateTimeField, DateField
from wtforms.validators import DataRequired, EqualTo, Length, URL, Email, Optional

from dateutil.parser import parse


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


class EventForm(FlaskForm):
    dt_start = DateTimeField('Start')
    dt_end = DateTimeField('End')


class FishFryForm(FlaskForm):
    '''define formats of fields used to add tasks
    '''
    # ffid = StringField()
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
    website = StringField('Venue Website', validators=[Optional(), URL()])
    email = StringField('E-Mail', validators=[Optional(), Email()])
    phone = StringField('Phone')
    homemade_pierogies = SelectField(
        "Homemade Pierogies", choices=boolean_choices)
    lunch = SelectField("Lunch Served", choices=boolean_choices)
    handicap = SelectField("Handicap Accessible", choices=boolean_choices)
    take_out = SelectField("Take-Out Available", choices=boolean_choices)
    alcohol = SelectField("Alcohol Served", choices=boolean_choices)
    menu_url = StringField('URL to Menu', validators=[Optional(), URL()])
    menu_txt = TextAreaField('Menu Text')
    etc = TextAreaField('Misc. Notes')
    publish = BooleanField("'Officially' Publish This Fish")
    validated = BooleanField("I've Validated This Fish Fry")
    # events = FieldList(StringField("Event"))
    events = FieldList(FormField(EventForm))
    lat = FloatField("Lat (Y)")
    lng = FloatField("Lng (X)")
