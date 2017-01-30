#!/usr/bin/env python

#import sqlalchemy
#from models import Base, engine
from app import db

#Base.metadata.create_all(bind=engine)
db.create_all()
