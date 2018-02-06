from ..models import FishFryFeature, FeatureCollection

tags = ["fishfry"]
produces = ["application/json"]

feature_schema_base = {
    "id": "FishFry",
    "required": ["properties"]
}
example_feature = {
    "type": "Feature",
    "properties": {
        "venue_notes": "Some notes about the venue",
        "website": "http: // fishfry.codeforpgh.com",
        "venue_name": "Pittsburgh VFC",
        "email": "",
        "validated": False,
        "homemade_pierogies": True,
        "phone": "412-123-4567",
        "venue_type": "Fire Department",
        "venue_address": "1000 Fish Fry Ave. Pittsburgh PA",
        "menu": {
            "text": "Fish Sandwich, Fries, Slaw: $7",
            "url": "http://fishfry.codeforpgh.com"
        },
        "lunch": True,
        "etc": "Some notes about our venue.",
        "take_out": True,
        "publish": True,
        "handicap": "",
        "events": [{
            "dt_start": "2018-02-23T16:00:00-05:00",
            "dt_end": "2018-02-23T19:00:00-05:00"
        },
            {
            "dt_start": "2018-03-02T16:00:00-05:00",
            "dt_end": "2018-03-02T19:00:00-05:00"
        },
            {
            "dt_start": "2018-03-16T16:00:00-04:00",
            "dt_end": "2018-03-16T19:00:00-04:00"
        },
            {
            "dt_start": "2018-03-09T16:00:00-05:00",
            "dt_end": "2018-03-09T19:00:00-05:00"
        },
            {
            "dt_start": "2018-03-23T16:00:00-04:00",
            "dt_end": "2018-03-23T19:00:00-04:00"
        },
            {
            "dt_start": "2018-03-30T16:00:00-04:00",
            "dt_end": "2018-03-30T19:00:00-04:00"
        }
        ],
        "alcohol": False
    },
    "id": "12ef7e40-88b7-49e1-ac5f-c03c1fb7ba8b",
    "geometry": {
        "coordinates": [-79.796407, 40.309443],
        "type": "Point"
    }
}

query_ffid = {
    "name": "ffid",
    "in": "query",
    "type": "string",
    "allowEmptyValue": False,
    "required": True,
    "description": "Fish Fry ID (a unique ID for each Fish Fry). Providing this will return a single Fish Fry as a GeoJSON feature."
}
query_strict = {
    "name": "strict",
    "in": "query",
    "type": "boolean",
    "allowEmptyValue": True,
    "default": False,
    "required": False,
    "description": "determines whether validation is performed on posted data (you'll be notified if what you submit doesn't conform to the spec)"
}
query_feature_post = {
    "name": "feature",
    "in": "body",
    "required": True,
    "description": "a Fish Fry, as a GeoJSON Feature",
    "schema": {}
}
query_feature_validated = {
    "name": "validated",
    "in": "query",
    "type": "boolean",
    # "enum": ["True", "False"],
    "allowEmptyValue": True,
    "required": False,
    "description": "Filter Fish Fries by their validation status."
}

query_feature_published = {
    "name": "published",
    "in": "query",
    "type": "boolean",
    # "enum": ["True", "False"],
    "allowEmptyValue": True,
    "required": False,
    "description": "Filter Fish Fries by their publication status."
}
query_feature_has_geom = {
    "name": "has_geom",
    "in": "query",
    "type": "boolean",
    "allowEmptyValue": True,
    "required": False,
    "description": "Return only fish fries with valid geojson geometry object (i.e., that have coordinates)."
}

get_FishFries = {
    "tags": ["fishfries"],
    "parameters": [query_feature_published, query_feature_validated],
    "produces": produces,
    "responses": {
        "200": {
            "description": "a geojson FeatureCollection of the Fish Fry or Fries; all/any Fish Fries are contained within the 'features' object",
            "schema": {
                "$ref": "#/definitions/FeatureCollection"
            }
        }
    }
}

get_FishFry = {
    "tags": tags,
    "parameters": [query_ffid],
    "produces": produces,
    "responses": {
        "200": {
            "description": "a geojson Feature representing a single Fish Fry.",
            "examples": example_feature,
            "schema": {
                "$ref": "#/definitions/FishFryFeature"
            }
        }
    }
}

post_FishFry = {
    "tags": tags,
    "parameters": [query_ffid, query_strict, query_feature_post],
    "produces": produces,
    "responses": {
        "200": {
            "description": "The new Fish Fry as a single geojson, with the newly created ID",
            "examples": example_feature,
            "schema": {
                "$ref": "#/definitions/FishFryFeature"
            }
        }
    }
}

put_FishFry = {
    "tags": tags,
    "parameters": [query_ffid, query_strict, query_feature_post],
    "produces": produces,
    "responses": {
        "200": {
            "description": "The new Fish Fry as a single geojson feature, with the newly created ID",
            "examples": example_feature,
            "schema": {
                "$ref": "#/definitions/FishFryFeature"
            }
        }
    }
}

del_FishFry = {
    "tags": tags,
    "parameters": [query_ffid],
    "produces": produces,
    "responses": {
        "200": {
            "description": "Confirmation that the Fish Fry was deleted.",
            "schema": {
                "$ref": "#/definitions/FishFryFeature"
            }
        }
    }
}
