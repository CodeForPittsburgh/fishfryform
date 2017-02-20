#!/usr/bin/env python

import requests
api_url = "https://christianbgass.carto.com/api/v2/sql"
api_key = "x"

import pprint
pp = pprint.PrettyPrinter(indent=2)

import json

# test 1
payload = {'q':'SELECT * FROM fishfrymap WHERE cartodb_id = 1', 'api_key':api_key, 'format':'GeoJSON'}
r = requests.get(api_url, params=payload)
pp.pprint(json.loads(r.text))

# test 2
q = '''SELECT * FROM fishfrymap INNER JOIN fishfry_dt ON fishfrymap.cartodb_id=fishfry_dt.venue_key'''
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

# test 3
q = '''SELECT * FROM fishfrymap INNER JOIN fishfry_dt ON fishfrymap.cartodb_id=fishfry_dt.venue_key WHERE fishfrymap.cartodb_id = 1'''
r = requests.get(api_url, params= {'q': q,'api_key': api_key}).text


pp.pprint(json.loads(r))

# test 4
q = '''SELECT dt, dt_init, venue_key FROM fishfrymap INNER JOIN fishfry_dt ON fishfry_venues.cartodb_id=fishfry_dt.venue_key WHERE fishfrymap.cartodb_id = 1'''
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

# test 5
q = """INSERT INTO fishfry_dt (dt) VALUES ('2017-03-21 13:00')"""
r = requests.get(api_url, params= {'q': q,'api_key': api_key})
pp.pprint(json.loads(r.text))

# test 6
pp.pprint(json.loads(requests.put("http://localhost:5000/api/fishfrys/201", params={"name":"The Name","type":"The Type"}).text))
pp.pprint(json.loads(requests.delete("http://localhost:5000/api/fishfrys/201").text))

q = """SELECT * FROM fishfrymap WHERE cartodb_id = 1; INSERT INTO fishfry_dt (dt_start, dt_end, venue_key) VALUES ('2017-05-03T19:00:00Z', '2017-05-03T19:00:00Z', 181)"""
pp.pprint(requests.get(api_url, params= {'q': q,'api_key': api_key}).text)