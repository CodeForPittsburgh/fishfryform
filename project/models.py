# models.py

# standard library
from dateutil.parser import parse
# sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
# werkzeug
#from werkzeug.security import generate_password_hash, check_password_hash
# database
from app import db

# Set your classes here.

class User(db.Model):

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.String, default='editor')
    authenticated = db.Column(db.Boolean, default=False)

    def __init__(self, email=None, password=None, role=None):
        self.email = email
        self.password = password
        self.role = role

    __tablename__ = 'user'

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


'''
# Connections to the Fish Fry database aren't direct. The following classes
# exist to structure data passed between the Fish Fry API and the CARTO SQL API.
class FishFryMap(object):

    def __init__(self):
        """initialize all variables"""
        self.cartodb_id = 0
        self.venue_name = ""
        self.venue_type = ""
        self.venue_notes = ""
        self.venue_address = ""
        self.website = ""
        self.email = ""
        self.phone = ""
        self.menu = ""
        self.etc_notes = ""
        self.homemade_pierogies = None
        self.lunch = None
        self.handicap = None
        self.take_out = None
        self.alcohol = None
        self.event_dt = []
        self.validated = False
        self.published = False

    def write_new(
        self,
        cartodb_id,
        venue_name,
        venue_address,
        event_dt,
        venue_type="",
        venue_notes="",
        website="",
        email="",
        phone="",
        homemade_pierogies=None,
        lunch=None,
        handicap=None,
        take_out=None,
        alcohol=None,
        menu="",
        etc_notes="",
        validated=False,
        published=False
        ):
        """Submit edits. Only 4 fields are mandatory for this"""
        
        # write submitted values to class 
        ## mandatory fields
        self.cartodb_id = cartodb_id
        self.venue_name = venue_name
        self.venue_address = venue_address
        self.event_dt = event_dt
        ## non mandatory fields
        self.venue_type = venue_type
        self.venue_notes = venue_notes
        self.website = website
        self.email = email
        self.phone = phone
        self.homemade_pierogies = homemade_pierogies
        self.lunch = lunch
        self.handicap = handicap
        self.take_out = take_out
        self.alcohol = alcohol
        self.menu = menu
        self.etc_notes = etc_notes
        # fields for QA/QC have defaults of False
        self.validated = validated
        self.published = published

        # run type-checking
        type_check = self.validate()
        if not type_check:
            
            fields = []
            values = []
            
            # build the query
            for k,v in {"cartodb_id":self.cartodb_id, "venue_name": self.venue_name, "venue_address":self.venue_address, "venue_type":self.venue_type, "venue_notes":self.venue_notes, "website":self.website,"email":self.email, "phone":self.phone, "homemade_pierogies":self.homemade_pierogies, "lunch":self.lunch, "handicap":self.handicap, "take_out":self.take_out, "alcohol":self.alcohol, "menu":self.menu, "etc_notes":self.etc_notes, "validated":self.validated,"published": self.published}.iteritems():
                # if the value has been supplied
                if v:
                    fields.append(k)
                    if isinstance(v,str):
                        values.append("""'{0}'""".format(v))
                    else:
                        values.append(v)
            
            
            q = """INSERT INTO fishfrymap {0} VALUES {1}""".format(tuple(fields),tuple(values))
            
            # submit the request
#            r = requests.get(app.config['CARTO_SQL_API_URL'], params= {'q': q,'api_key': app.config['CARTO_SQL_API_KEY']})
            #pp.pprint(json.loads(r.text))
            return q
        else: 
            return type_check
        
        
    def submit_edit(self):
        pass
    
    def validate(self):
        """validates inputs for anything that isn't a string"""
        
        catch = []
        
        # ensure cartodb_id is an integer
        if isinstance(self.cartodb_id, int):
            pass
        else:
            catch.append("cartodb_id '{0}' is not an integer")
        
        # ensure booleans are booleans
        for k,v in {'alcohol' : self.alcohol, 'homemade_pierogies' : self.homemade_pierogies, 'lunch' : self.lunch, 'take_out' : self.take_out, 'handicap' : self.handicap}.iteritems():
            if v is None:
                pass
            else:
                if isinstance(v,(bool)):
                    pass
                else:
                    catch.append("value for field {0} is not of type boolean (true, false) or null")
        
        # ensure event_dt is constructed and formatted correctly 
        # minimally, it must be an empty list
        if isinstance(self.event_dt, list):
            dts = len(self.event_dt)
            if dts > 0:
                for each_dt in self.event_dt:
                    idx = self.event_dt.index(each_dt)
                    # ensure 
                    if isinstance(each_dt, dict):
                        if 'dt_start' in each_dt:
                            try:
                                parse(each_dt)
                            except:
                                catch.append("Incorrect datetime format (event_dt[{0}] dt_start). Must be 'YYYY-MM-DDThh:mm:ssZ', e.g., '2017-03-03T17:30:00Z'")
                        else:
                            catch.append("event_dt[{0}]: dt_start not present".format(idx))
                                         
                        if 'dt_end' in each_dt:
                            try:
                                parse(each_dt)
                            except:
                                catch.append("Incorrect datetime format (event_dt[{0}] dt_end). Must be 'YYYY-MM-DDThh:mm:ssZ', e.g., '2017-03-03T17:30:00Z'")
                        else:
                            catch.append("event_dt[{0}]: dt_end not present".format(idx))
                    else:
                        catch.append("the contents of event_dt must be json objects: {'dt_start':YYYY-MM-DDThh:mm:ssZ, 'dt_end':YYYY-MM-DDThh:mm:ssZ}")
        else:
            catch.append("event_dt must be an array []")
                            
        if len(catch) > 0:
            return {"validation_errors": catch}
        else:
            return None

    def __repr__(self):
        print("Fish Fry ID: {0}".format(self.cartodb_id))
        

class FishFryDT(object):

    __tablename__ = 'fishfry_dt'

    def __init__(self, venue_key, dt_start, dt_end):
        self.venue_key = venue_key
        self.dt_start = dt_start
        self.dt_end = dt_end

    def __repr__(self):
        print("Venue Key {0}>".format(self.venue_key))

'''