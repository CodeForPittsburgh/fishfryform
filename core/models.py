# standard library
import json
import datetime
import uuid

# dependencies
import geojson
from marshmallow import Schema, fields, pprint
from sqlalchemy.schema import ForeignKeyConstraint
from flask_security import UserMixin, RoleMixin
# application
from . import application_db as db

#----------------------------------------------------------------------------
# Fish Fry Schema


class FishFryEvent(Schema):
    """Fish Fry event dates/times
    """
    dt_start = fields.DateTime(allow_none=True)
    dt_end = fields.DateTime(allow_none=True)


class FishFryMenu(Schema):
    """Fish Fry geometry (geojson spec)
    """
    url = fields.Url(allow_none=True)
    text = fields.Str(allow_none=True)


class FishFryProperties(Schema):
    """Fish Fry properties
    """
    venue_name = fields.Str()
    venue_address = fields.Str()
    venue_type = fields.Str(allow_none=True)
    venue_notes = fields.Str(allow_none=True)
    website = fields.Url(allow_none=True)
    email = fields.Email(allow_none=True)
    phone = fields.Str(allow_none=True)
    menu = fields.Nested(FishFryMenu)
    homemade_pierogies = fields.Bool(allow_none=True)
    lunch = fields.Bool(allow_none=True)
    handicap = fields.Bool(allow_none=True)
    take_out = fields.Bool(allow_none=True)
    alcohol = fields.Bool(allow_none=True)
    etc = fields.Str(allow_none=True)
    publish = fields.Bool(allow_none=True)
    validated = fields.Bool(allow_none=True)
    events = fields.List(fields.Nested(FishFryEvent))


class FishFryFeature(Schema):
    properties = fields.Nested(FishFryProperties)
    geometry = fields.Dict(default={
        "type": "Point",
        "coordinates": []
    })
    id = fields.Str(default=str(uuid.uuid4()))
    type = fields.Str(default="Feature")

#----------------------------------------------------------------------------
# Generic schema


class Feature(Schema):
    properties = fields.Dict()
    geometry = fields.Dict()
    type = fields.Str()


class FeatureCollection(Schema):
    type = fields.Str()
    features = fields.List(fields.Nested(Feature))

#----------------------------------------------------------------------------
# User authentication models


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
