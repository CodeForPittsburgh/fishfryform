"""
test_api.py

Test calls the FishFry API.

Note that tests that submit data to the API may use True or False for the
"strict" argument in requests, depending on whether or not testing the
schema of the input data is the focus of the test. This is because we're
using random data for a test data, and sometimes it doesn't quite
meet the spec (but anyone submitting data to via the API will need to!)

"""

import os
import json
import decimal
import unittest
import uuid
import base64
from random import sample
from datetime import date

from flask_security import SQLAlchemyUserDatastore
from flask_security.utils import encrypt_password

from werkzeug.datastructures import Headers

from core import application, api, application_db, dynamo_db
from core.admin import user_datastore
from core.config import basedir
from core.models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, FeatureCollection, Feature
from core.models import User, Role

# workaround for boto3 bug when creating tables in dynamodb
os.environ["TZ"] = "UTC"

# test folder and data locations
tests_path = os.path.dirname(os.path.realpath(__file__))
TEST_FEATURES = os.path.join(tests_path, r'features.json')

# test databases/tables
TEST_ADMIN_DB = 'test.db'
TEST_DYNAMODB_TABLE = application.config['DYNAMO_TABLES'][0]
TEST_DYNAMODB_TABLE["TableName"] = 'FishFryTestDB'

TEST_ADMIN_USERNAME = "admin@fishfry.org"
TEST_ADMIN_PASSWORD = "aPassw0rd"
TEST_REGLR_USERNAME = "contributor@fishfry.org"
TEST_REGLR_PASSWORD = "aPassw0rd"


class DecimalEncoder(json.JSONEncoder):
    """convert any DynamoDB items stored as Decimal objects to numbers.
    """

    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)


class APITests(unittest.TestCase):

    # -------------------------------------------------------------------------
    # SETUP AND TEARDOWN

    def setUp(self):
        # set config variables
        application.config['TESTING'] = True
        application.config['WTF_CSRF_ENABLED'] = False
        application.config['DEBUG'] = False
        # set test admin database (sqlite)
        application.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + \
            os.path.join(tests_path, TEST_ADMIN_DB)
        # specify the test Dynamo tables (running on a LOCAL Dynamo DB instance!!!)
        application.config['DYNAMO_ENABLE_LOCAL'] = True
        application.config['DYNAMO_TABLES'] = [TEST_DYNAMODB_TABLE]

        # initialize the test client
        self.testapp = application.test_client()

        # create the dynamo db tables
        with application.app_context():
            try:
                dynamo_db.create_all()
            except OSError:
                # see https://github.com/dateutil/dateutil/issues/197
                # print(
                #   "(a dateutil bug causes an OSError Excepation to be raised by Boto3 here, which we ignore for testing)"
                # )
                pass

            # create the admin db tables and some users
            application_db.create_all()
            # admin user
            new_admin_user = User(
                TEST_ADMIN_USERNAME,
                TEST_ADMIN_PASSWORD,
                [Role('admin')]
            )
            application_db.session.add(new_admin_user)
            new_reglr_user = User(
                TEST_REGLR_USERNAME,
                TEST_REGLR_PASSWORD,
                [Role("contributor")]
            )
            application_db.session.add(new_reglr_user)
            application_db.session.commit()

        # make sure debug mode is off
        self.assertEqual(application.debug, False)

    def tearDown(self):
        # tear down test admin db
        application_db.session.remove()
        application_db.drop_all()
        # remove test dynamo db table
        table = dynamo_db.tables[TEST_DYNAMODB_TABLE['TableName']]
        try:
            table.delete()
        except OSError:
            # see https://github.com/dateutil/dateutil/issues/197
            # print("(a dateutil bug causes an OSError Excepation to be raised by Boto3 here, which we ignore for testing)")
            pass
        # print("Tear-down complete")

    # -------------------------------------------------------------------------
    # HELPERS

    def auth_header_for_admin(self):
        h = Headers()
        auth_string = '{0}:{1}'.format(
            TEST_ADMIN_USERNAME,
            TEST_ADMIN_PASSWORD
        )
        encoded_auth_string = base64.b64encode(
            str.encode(auth_string)).decode()
        h.add(
            'Authorization',
            'Basic {0}'.format(encoded_auth_string)
        )
        return h

    def auth_header_for_reglr(self):
        h = Headers()
        auth_string = '{0}:{1}'.format(
            TEST_REGLR_USERNAME,
            TEST_REGLR_PASSWORD
        )
        encoded_auth_string = base64.b64encode(
            str.encode(auth_string)).decode()
        h.add(
            'Authorization',
            'Basic {0}'.format(encoded_auth_string)
        )
        return h

    def get_random_features(self, sample_size=10):
        """read random test geojson features to a dynamo db table
        """
        # print("***Getting random test data***")
        with open(TEST_FEATURES) as json_file:
            gj = json.load(json_file, parse_float=decimal.Decimal)
        features = sample(gj['features'], sample_size)
        return features

    def add_many_random_features(self, sample_size=10):
        """add test geojson features to a dynamo db table
        """
        features = self.get_random_features(sample_size=sample_size)
        table = dynamo_db.tables[TEST_DYNAMODB_TABLE['TableName']]
        new_features = []
        for feature in features:
            new_feature = {
                'id': str(uuid.uuid4()),
                'type': "Feature",
                'properties': feature['properties'],
                'geometry': feature['geometry']
            }
            response = table.put_item(
                Item=new_feature
            )
            new_features.append(new_feature)
        return new_features

    def add_one_random_feature(self):
        """gets one random feature from the source, adds to the database,
        returns the feature (so its properties can be used for testing)
        """
        feature = self.get_random_features(sample_size=1)[0]
        table = dynamo_db.tables[TEST_DYNAMODB_TABLE['TableName']]
        ffid = str(uuid.uuid4())
        response = table.put_item(
            Item={
                'id': ffid,
                'type': "Feature",
                'properties': feature['properties'],
                'geometry': feature['geometry']
            }
        )
        return feature

    # -------------------------------------------------------------------------
    # TESTS

    # RETRIEVE DATA

    def test_get_all_features(self):
        """get geojson of all data at endpoint
        """
        self.add_many_random_features()
        response = self.testapp.get('/api/fishfries/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        # data, errors = FeatureCollection().load(response.data)
        self.assertIn(b'FeatureCollection', response.data)
        self.assertIn(b'features', response.data)

    def test_get_one_feature(self):
        """get a single feature by id
        """
        feature = self.add_one_random_feature()
        ffid = feature['id']
        response = self.testapp.get('/api/fishfry/?ffid={0}'.format(ffid))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode(ffid), response.data)

    def test_get_one_invalid_feature(self):
        """get correct response for request that uses invalid id
        """
        ffid = "th1s-is-n0t-a-val1d-uuid4"
        response = self.testapp.get('/api/fishfry/?ffid={0}'.format(ffid))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertNotIn(str.encode(ffid), response.data)

    # POST DATA ---------------------------------

    def test_create_one_feature(self):
        """add a feature to the db
        """
        feature = self.get_random_features(sample_size=1)[0]
        test_req_property = feature['properties']['venue_name']
        # submit a feature to the database via api
        h = self.auth_header_for_admin()
        response = self.testapp.open(
            path='/api/fishfry/?strict=False',
            method='POST',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode(test_req_property), response.data)

    def test_create_and_get_one_feature(self):
        """add a feature to the db, the retrieve it
        """
        feature = self.get_random_features(sample_size=1)[0]
        ffid = feature['id']
        # submit a new feature to the database via api
        response = self.testapp.post(
            path='/api/fishfry/?strict=False',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        # then make sure we can get that feature
        response = self.testapp.get('/api/fishfry/?ffid={0}'.format(ffid))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode(ffid), response.data)

    def test_create_one_feature_with_missing_properties(self):
        """attemp to submit a feature with required things missing
        """
        feature = self.get_random_features(sample_size=1)[0]
        # remove a required key
        feature.pop('properties')
        # submit a feature to the database via api
        response = self.testapp.post(
            path='/api/fishfry/?strict=False',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(
            str.encode(
                "Submitted json is not valid"),
            response.data
        )

    def test_create_one_feature_with_invalid_properties(self):
        """attempt to submit a feature with an invalid properties schema
        """
        feature = self.get_random_features(sample_size=1)[0]
        # overwrite properties so they are invalid per the schema
        feature['properties']['venue_address'] = None
        feature['properties']['website'] = "thisIsNotaValidURL"
        # submit feature to the database via api
        response = self.testapp.post(
            path='/api/fishfry/?strict=True',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode("website"), response.data)
        self.assertIn(str.encode("venue_address"), response.data)

    # PUT DATA ---------------------------------

    def test_update_one_feature(self):
        """update a feature in the db
        """
        feature = self.add_one_random_feature()
        # ffid = feature['id']
        # change a subset of the properties
        feature['properties']['url'] = "http://new.website.com"
        feature['properties']['etc'] = "an updated description"
        response = self.testapp.put(
            path='/api/fishfry/?strict=False',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode("http://new.website.com"), response.data)
        self.assertIn(str.encode("an updated description"), response.data)

    def test_update_one_feature_with_invalid_properties(self):
        """attempt to update a feature in the db using bad
        """
        feature = self.add_one_random_feature()
        ffid = feature['id']
        # change a subset of the properties
        feature['properties']['website'] = "www.fishfry.com"
        response = self.testapp.put(
            path='/api/fishfry/?strict=True',
            data=json.dumps(feature, cls=DecimalEncoder),
            content_type='application/json',
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode("website"), response.data)
        self.assertNotIn(str.encode(ffid), response.data)

    # DELETE DATA ---------------------------------

    def test_delete_one_from_the_database(self):
        """delete a feature from the database
        """
        feature = self.add_one_random_feature()
        ffid = feature['id']
        # delete the feature
        response = self.testapp.delete(
            path='/api/fishfry/?ffid={0}'.format(ffid),
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode(
            "Fish Fry {0} was removed from the database".format(ffid)
        ), response.data)

    def test_delete_attempt(self):
        """attempt to delete a feature from the database with bad id.
        """
        self.add_many_random_features()
        ffid = "this-is-not-a-fish-fry-id"
        # delete the feature
        response = self.testapp.delete(
            path='/api/fishfry/?ffid={0}'.format(ffid),
            headers=self.auth_header_for_admin()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode(
            "Fish Fry {0} does not exist in the the database".format(ffid)
        ), response.data)

    def delete_one_from_the_database_not_admin(self):
        """attempt to delete a feature from the database without being an admin
        """
        feature = self.add_one_random_feature()
        ffid = feature['id']
        # delete the feature
        response = self.testapp.delete(
            path='/api/fishfry/?ffid={0}'.format(ffid),
            headers=self.auth_header_for_reglr()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn(str.encode("Unauthorized"), response.data)


if __name__ == '__main__':
    unittest.main()
