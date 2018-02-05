"""
test_form.py

Test submission to the FishFry Form.

"""

import os
import json
import decimal
import unittest
import uuid
from random import sample
from datetime import date

from core import application, api, application_db, dynamo_db
from core.config import basedir
from core.models import FishFryFeature, FishFryProperties, FishFryEvent, FishFryMenu, FeatureCollection, Feature

# workaround for boto3 bug when creating tables in dynamodb
os.environ["TZ"] = "UTC"

# test folder and data locations
tests_path = os.path.dirname(os.path.realpath(__file__))
TEST_FEATURES = os.path.join(tests_path, r'features.json')

# test databases/tables
TEST_ADMIN_DB = 'test.db'
TEST_DYNAMODB_TABLE = application.config['DYNAMO_TABLES'][0]
TEST_DYNAMODB_TABLE["TableName"] = 'FishFryTestDB'


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

        # create the admin db tables
        application_db.create_all()

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

    def test_load_empty_form(self):
        """empty form renders without errors
        """
        response = self.testapp.get('/new/')
        self.assertIn(b'Record a New Fish Fry', response.data)

    def test_load_existing_fry(self):
        """load a feature from the database into the form
        """
        feature = self.add_one_random_feature()
        ffid = feature['id']
        # venue_name = feature['properties']['venue_name']
        response = self.testapp.get(
            '/edit/?ffid={0}'.format(ffid))
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Edit an Existing Fish Fry', response.data)
        # self.assertIn(str.encode(venue_name), response.data)

    def test_submit_a_new_fry(self):
        """submit a new fry to the endpoint. No ffid.
        Page re-renders, with flask-flash message with status
        """
        feature = self.get_random_features(1)[0]
        response = self.testapp.get('/api/fishfries/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        # data, errors = FeatureCollection().load(response.data)
        self.assertIn(b'FeatureCollection', response.data)
        self.assertIn(b'features', response.data)

    def submit_an_update(self):
        """submit an updated fry to the endpoint. Has ffid
        Page re-renders, with flask-flash message with status.
        """
        feature = self.get_random_features(1)[0]

        response = self.testapp.get('/api/fishfries/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        # data, errors = FeatureCollection().load(response.data)
        self.assertIn(b'FeatureCollection', response.data)
        self.assertIn(b'features', response.data)


if __name__ == '__main__':
    unittest.main()
