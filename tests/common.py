    def setUp():
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

    def tearDown():
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
