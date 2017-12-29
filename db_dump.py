'''
get data dump from the CARTO API
'''

import requests
api_url = "https://christianbgass.carto.com/api/v2/sql"
api_key = "34b32d54175a00a86f7a468c709ee36c455e060b"

import pprint
pp = pprint.PrettyPrinter(indent=2)

import json

# test 1
payload = {'q':'SELECT * FROM fishfrymap','api_key':api_key,'format':'gpkg','filename':'dump.gpkg'}
r = requests.get(api_url, params=payload)
print(r.request)
# pp.pprint(json.loads(r.text))
repr(r.text)