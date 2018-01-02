# standard library
#import json
#import datetime

# dependencies
#import geojson
#from geoalchemy2 import Geometry
#from geoalchemy2.shape import to_shape, from_shape
#from sqlalchemy.schema import ForeignKeyConstraint
from flask_security import UserMixin, RoleMixin

# application
from .__init__ import application_db as db

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

class FishFry(db.Model):
    """
    Fish Fry model
    """
    def __str__(self):
        return None