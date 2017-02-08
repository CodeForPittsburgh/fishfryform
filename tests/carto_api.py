#!/usr/bin/env python

import requests
api_url = "https://christianbgass.carto.com/api/v2/sql"
api_key = "50805253fe5c7e0e5eae541d35c08c113e515f0f"

import pprint
pp = pprint.PrettyPrinter(indent=2)

import json

# test 1
payload = {'q':'SELECT * FROM fishfrymap WHERE cartodb_id = 1', 'api_key':api_key, 'format':'GeoJSON'}
r = requests.get(api_url, params=payload)
pp.pprint(json.loads(r.text))

# test 2
q = '''SELECT * FROM fishfrymap INNER JOIN fishfry_dt ON fishfrymap.cartodb_id=fishfry_dt.venue_key '''
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

q = '''SELECT * FROM fishfrymap INNER JOIN fishfry_dt ON fishfrymap.cartodb_id=fishfry_dt.venue_key WHERE fishfry_venues.cartodb_id = 1'''
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

q = '''SELECT dt, dt_init, venue_key FROM fishfrymap INNER JOIN fishfry_dt ON fishfry_venues.cartodb_id=fishfry_dt.venue_key WHERE fishfrymap.cartodb_id = 1'''
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

q = """INSERT INTO fishfry_dt (dt) VALUES ('2017-03-21 13:00')"""
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))