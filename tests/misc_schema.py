"""
explores the marshmallow schema
"""

import os
import json
from core import models
from marshmallow import pprint

dir_path = os.path.dirname(os.path.realpath(__file__))
feature = json.load(open(os.path.join(dir_path, r'feature.json'), 'r'))
features = json.load(open(os.path.join(dir_path, r'features.json'), 'r'))[
    'features']

schema = models.FishFry()
result = schema.load(feature)

# print("Data")
# pprint(result.data,indent=2)
# print("\nErrors")
# pprint(result.errors,indent=2)

for feature in features:
    data, errors = models.FishFry().load(feature)
    if errors:
        print("\n", feature['id'], errors)
