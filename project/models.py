# models.py

# sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
# geoalchemy (extends sqlalchemy)
from geoalchemy2 import Geometry
# werkzeug
from werkzeug.security import generate_password_hash, check_password_hash
# database
from app import db

# Set your classes here.

class User(db.Model):

    __tablename__ = 'user'

    email = db.Column(db.String, primary_key=True)
    password = db.Column(db.String)
    authenticated = db.Column(db.Boolean, default=False)

    def is_active(self):
        """True, as all users are active."""
        return True

    def get_id(self):
        """Return the email address to satisfy Flask-Login's requirements."""
        return self.email

    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return self.authenticated

    def is_anonymous(self):
        """False, as anonymous users aren't supported."""
        return False


class Company(db.Model):

    __tablename__ = 'companies'

    id = db.Column(db.Integer, primary_key=True)
    afid = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    county = db.Column(db.String(255), nullable=False)
    #geom = db.Column(Geometry('POINT'))
    geom = db.Column(db.String(255), nullable=False)
    contact_id = db.Column(db.Integer, db.ForeignKey('contacts.id'))
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'))

    def __init__(self,afid,name,address,county,geom,contact_id,campaign_id):
        self.afid = afid
        self.name = name
        self.address = address
        self.county = county
        self.geom = geom
        self.contact_id = contact_id
        self.campaign_id = campaign_id

    def __repr__(self):
        print("<company {}>".format(self.name))


class Campaign(db.Model):

    __tablename__ = 'campaigns'

    id = db.Column(db.Integer, primary_key=True)
    campaign = db.Column(db.String(255), nullable=True)
    company_relate = db.relationship('Company', backref='campaign')

    def __init__(self, campaign, company_id):
        self.campaign = campaign
        self.company_id = company_id

    def __repr__(self):
        print("<campaign {}>".format(self.campaign))


class Contact(db.Model):

    __tablename__ = 'contacts'

    id = db.Column(db.Integer, primary_key=True)
    first = db.Column(db.String(120), nullable=False)
    last = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.Integer, nullable=True)
    email = db.Column(db.String, nullable=True)
    event_date = db.Column(db.Date, nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    company_relate = db.relationship('Company', backref='company')

    def __init__(self,first,last,title,phone,email,event_date,company_id):
        self.first = first
        self.last = last
        self.title = title
        self.phone = phone
        self.email = email
        self.event_date = event_date

    def __repr__(self):
        print("<contact {} {}".format(self.first, self.last))

class Event(db.Model):

    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    event = db.Column(db.String(120), nullable=True)
    event = db.relationship('Contact', backref='event')

    def __init__(self, event, contacts_id):
        self.event = event
        self.contacts_id = contacts_id

    def __repr__(self):
        print("<event {0}>".format(self.event))
