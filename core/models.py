# standard library
import json
import datetime

# dependencies
import geojson
# from geoalchemy2 import Geometry
# from geoalchemy2.shape import to_shape, from_shape
from sqlalchemy.schema import ForeignKeyConstraint
from flask_security import UserMixin, RoleMixin

# application
from . import application_db as db

# def from_geom(geom_col_value):
#     try:
#         return to_shape(geom_col_value)
#     except:
#         return None
    
# def parse_date(date_val):
#     '''dates are returned as date.datetime objs. Need to be parsed to isoformat
#     if not null
#     '''
#     if isinstance(date_val, datetime.date):
#         return date_val.isoformat()
#     else:
#         return date_val

lookup_roles_users = db.Table(
    'lookup_roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

class Role(db.Model, RoleMixin):
    """
    Role is a user-specific property that controls access to certain parts
    of the site. It can work in-tandem or without organizations.
    """       
    #__tablename__ = 'roles'
    
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

    def __str__(self):
        return self.name

class User(db.Model, UserMixin):
    """
    Represents each User.
    
    Users have roles and belong to organizations. Those relationships provide
    access to resources.
    """
    #__tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    roles = db.relationship(
        'Role',
        secondary=lookup_roles_users,
        backref=db.backref('users', lazy='dynamic')
    )
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())

    def __str__(self):
        return self.email


# class FishFry(db.Model):
#     """
#     Fish Fry model
#     """
#     __tablename__ = 'fishfrys'
#     cartodb_id = db.Column(db.Integer, primary_key=True)
#     ogc_fid = db.Column(db.Integer)
#     uuid = db.Column(db.String(128))
#     venue_name = db.Column(db.String(500))
#     venue_address = db.Column(db.String(500))
#     venue_type = db.Column(db.String(255))
#     venue_notes = db.Column(db.String(1000))
#     website = db.Column(db.String(1000))
#     email = db.Column(db.String(255))
#     phone = db.Column(db.String(25))
#     menu = db.Column(db.String(1000))
#     homemade_pierogies = db.Column(db.Boolean())
#     lunch = db.Column(db.Boolean())
#     handicap = db.Column(db.Boolean())
#     take_out = db.Column(db.Boolean())
#     alcohol = db.Column(db.Boolean())
#     etc = db.Column(db.String(1000))
#     publish = db.Column(db.Boolean())
#     validated = db.Column(db.Boolean())
#     geom = db.Column(Geometry('POINT'))
#     dts = db.relationship("FishFry_DT", backref="geo", lazy='dynamic')

#     def __str__(self):
#         return None

# class FishFry_DT(db.Model):
#     """
#     Fish Fry event dates/times model
#     """
#     __tablename__ = 'fishfrys_dt'
#     id = db.Column(db.Integer, primary_key=True)
#     dt_start = db.Column(db.Date)
#     dt_end  = db.Column(db.Date)
#     fishfry_uuid = db.Column(db.String, db.ForeignKey('fishfrys.uuid'))

#     def __str__(self):
#         return None
