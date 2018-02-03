from flask_wtf import Form
from wtforms import PasswordField, StringField, TextField, SelectField, BooleanField, DateTimeField, TextAreaField
from wtforms.validators import DataRequired, EqualTo, Length, URL, Email


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


class EventForm(Form):
    dt_start = DateTimeField(
        'Event Date/time start',
        validators=[DataRequired()],
        format='%m/%d/%Y'
    )
    dt_end = DateTimeField(
        'Event Date/time end',
        validators=[DataRequired()],
        format='%m/%d/%Y'
    )
