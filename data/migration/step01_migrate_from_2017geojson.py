'''
This script migrates the 2017 Fish Fry geojson to a NoSQL-ready geojson
(targeting DynamoDB) for the 2018 season.
'''

import json
import os
from datetime import datetime
from dateutil.parser import parse
from dateutil import tz
import validators
import uuid


# get the fishfry json
dir_path = os.path.dirname(os.path.realpath(__file__))
input_geojson = os.path.join(dir_path, 'fishfrymap.geojson')
output_geojson = os.path.join(dir_path, 'fishfrymap2018starter2.geojson')

last_season = 2017
this_season = 2018

def migrate_dates(
    dt_obj,     
    event_migration_lookup = {
        '2017-03-01':'2018-02-14',
        '2017-03-03':'2018-02-16',
        '2017-03-10':'2018-02-23',
        '2017-03-17':'2018-03-02',
        '2017-03-24':'2018-03-09',
        '2017-03-31':'2018-03-16',
        '2017-04-07':'2018-03-23',
        '2017-04-14':'2018-03-30'
    }):
    key = "{0}-{1}-{2}".format(
        dt_obj.year, str(dt_obj.month).zfill(2),str(dt_obj.day).zfill(2)
    )
    if key in event_migration_lookup.keys():
        result = "{0}T{1}:{2}:00".format(
            # construct ISO8061-formatted string with new date from lookup, 
            # but with previously recorded time of day (minus the timezone)
            event_migration_lookup[key], dt_obj.hour, dt_obj.minute
        )
        dt_obj2 = parse(result)
        # assign the timezone (this ensures we account for DST!)
        dt_obj2 = dt_obj2.replace(tzinfo=tz.gettz('America/New_York'))
        return dt_obj2
    return None

def run(input_geojson, output_geojson, append_old=False):

    with open(input_geojson,'r') as input_geojson_file:
        d = json.load(input_geojson_file)

    features_last_season = []
    features_this_season = []

    for f in d['features']:

        print(f['properties']['cartodb_id'])

        # rebuild the basic geojson feature, with a new brand new fish fry id (ffid, a uuid)
        feature = {
            'ffid': str(uuid.uuid4()),
            'geometry': f['geometry'],
            'properties' : {}
            #     k:v for k,v in f['properties'].items() if k not in ['uuid', 'events','menu']
            # }
        }

        for k, v in f['properties'].items():
            if k not in ['uuid', 'events', 'menu']:
                if v != "":
                    feature['properties'][k] = v
                else:
                    #missing values can't be empty strings, the must be null!
                    feature['properties'][k] = None

        # reset validation/publication properties
        feature['properties']['validated'] = False
        feature['properties']['publish'] = False

        # transform the menu object, detecting urls if only a url is present
        menu = f['properties']['menu']
        new_menu = {}
        if menu: 
            if validators.url(menu):
                new_menu.update({'url':menu,'text':None})
            else:
                new_menu.update({'url':None,'text':menu})
        else:
            new_menu.update({'url':None,'text':None})
        feature['properties']['menu'] = new_menu

        # transform events object
        old_events = {}
        new_events = {}
        for e in f['properties']['events']:
            # get the existing datetime ISO strings
            old_d0 = f['properties']['events'][e]["dt_start"]
            old_d1 = f['properties']['events'][e]["dt_end"]
            
            # transform old datetimes to new dates w/ previous times
            new_d0 = migrate_dates(parse(old_d0))
            new_d1 = migrate_dates(parse(old_d1))
            if new_d0 and new_d1:
                d0, d1 = new_d0.isoformat(), new_d1.isoformat()
                # convert the old event object index to an ISO 8601 time interval string
                new_index = "{0}/{1}".format(d0, d1)
                new_events[new_index] = {"dt_start": d0, "dt_end": d1}

            if append_old:
                # convert the old event object index to an ISO 8601 time interval string
                old_index = "{0}/{1}".format(old_d0, old_d1)
                old_events[old_index] = {"dt_start": old_d0, "dt_end":old_d1}

        # last season
        if append_old:
            feature["season"] = last_season
            feature['properties']["events"] = old_events
            features_last_season.append(feature)
            print(repr(feature))

        # this season features (modify the object and push)
        feature["season"] = this_season
        feature['properties']["events"] = new_events
        features_this_season.append(feature)
        print(repr(feature))

    features = []
    features.extend(features_this_season)
    features.extend(features_last_season)
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open(output_geojson,'w') as output_file:
        json.dump(geojson, output_file)

if __name__ == "__main__":
    run(input_geojson, output_geojson)