#test_main.py
'''
Note: tests here only for things handled by Flask. Can't test for anything that
might happen as a result of running javascript in the browser, e.g., loading the
data data table on the contribute page. That's probably better handled by a
separate, js-focused testing suite.
'''

import os, unittest

from project.app import app
from project.app import db
from project.config import basedir
from project.models import User

TEST_DB = 'test.db'

class MainTests(unittest.TestCase):
    
    # ----------------------------
    # SETUP AND TEARDOWN
    
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['DEBUG'] = False
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, TEST_DB)
        self.app = app.test_client()
        db.create_all()
        
        self.assertEquals(app.debug, False)
        
    def tearDown(self):
        db.session.remove()
        db.drop_all()

    # ----------------------------
    # HELPERS
    
    def login(self, name, password):
        """helper method to log users in as necessary"""
        return self.app.post(
            '/',
            data=dict(name=name, password=password),
            follow_redirects=True
        )
    
    def register(self, name, email, password, confirm):
        return self.app.post(
            'register/',
            data=dict(name=name, email=email, password=password, confirm=confirm),
            follow_redirects=True
        )
    
    def logout(self):
        return self.app.get('logout/', follow_redirects=True)
    
    def create_user(self, name, email, password):
        new_user = User(
            name=name,
            email=email,
            password=bcrypt.generate_password_hash(password)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
    def create_admin_user(self):
        new_user = User(
            name='Superman',
            email='admin@realpython.com',
            password=bcrypt.generate_password_hash('allpowerful'),
            role='admin'
        )
        db.session.add(new_user)
        db.session.commit()
        
    def create_fishfry(self):
        """to be completed
        return self.app.post('add/', data=dict(
            name='Go to the bank',
            due_date='02/05/2017',
            priority='1',
            posted_date='11/20/2016',
            status='1'
            ), follow_redirects=True
        )
        """
        pass
    
    
    # TESTS
    # ---------------------------------------------
    
    def test_load_contribute_page(self):
        """Contribute page loads.
        """
        response = self.app.get('contribute/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'''Edit Fish Frys''' ,response.data)

    def test_load_form_page(self):
        """Fish Fry Form page loads.
        """
        response = self.app.get('contribute/fishfry')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'''Edit Fish Frys''' ,response.data)
    

    '''
    def test_form_loads_empty(self):
        response = self.app.get('contribute/form/')
        self.assertEqual(response.status_code, 200)
        
    
    def test_form_loads_a_record(self):
        response = self.app.get('contribute/form/62')
        self.assertEqual(response.status_code, 200)
        
    '''
    
    '''
    
    # EDITING FISH FRYS
    
    
    # SUBMITTING FISH FRYS
    
    def test_users_can_complete_tasks(self):
        """user can submit a fish fry"""
        self.create_user('CBG1', 'a@bc.com','1234',)
        self.login('CBG1', '1234')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        response = self.app.get("complete/1/", follow_redirects=True)
        self.assertIn(b'Task marked complete', response.data)

    def test_users_cannot_add_tasks_when_error(self):
        """user cannot add fish fry if dates are incomplete"""
        self.create_user('CBG1', 'a@bc.com','1234',)
        self.login('CBG1', '1234')
        self.app.get('tasks/', follow_redirects=True)
        response = self.app.post(
            'add/',
            data=dict(
                name='Go to the bank',
                due_date='',
                priority='1',
                posted_date='11/20/2016',
                status='1'
            ),
            follow_redirects=True
        )
        self.assertIn(b'field is required.', response.data)
        
    '''
    

        
    '''
    
    # DELETING TASKS
    
    def test_users_can_delete_tasks(self):
        """logged in user can delete a task"""
        self.create_user('CBG1', 'a@bc.com','1234',)
        self.login('CBG1', '1234')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        response = self.app.get("delete/1/", follow_redirects=True)
        self.assertIn(b'The task was deleted.', response.data)
        
    # USER MANAGEMENT OF TASKS
    
    def test_users_cannot_complete_tasks_that_are_not_created_by_them(self):
        """if user "A" adds a task, only user "A" can copmlete that task"""
        # create a user, and have it create a task, then logout
        self.create_user('Michael', 'michael@realpython.com', 'python')
        self.login('Michael', 'python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()
        # create another user, then try to complete the task (#1) created by 1st user
        self.create_user('Fletcher', 'fletcher@realpython.com', 'python101')
        self.login('Fletcher', 'python101')
        self.app.get('tasks/', follow_redirects = True)
        response = self.app.get("complete/1/", follow_redirects=True)
        self.assertNotIn(b'Task marked complete', response.data)
        self.assertIn('You can only update tasks that belong to you', response.data)

    def test_users_cannot_delete_tasks_that_are_not_created_by_them(self):
        """if user "A" adds a task, only user "A" can delete that task"""
        # create a user, and have it create a task, then logout
        self.create_user('Michael', 'michael@realpython.com', 'python')
        self.login('Michael', 'python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()
        # create another user, then try to complete the task (#1) created by 1st user
        self.create_user('Fletcher', 'fletcher@realpython.com', 'python101')
        self.login('Fletcher', 'python101')
        self.app.get('tasks/', follow_redirects = True)
        response = self.app.get("delete/1/", follow_redirects=True)
        self.assertNotIn(b'Task marked complete', response.data)
        self.assertIn('You can only delete tasks that belong to you', response.data)
    
    def test_users_cannot_see_task_modify_links_for_tasks_not_created_by_them(self):
        """checks to see if links for 'Mark as complete' and 'Delete' tasks are
        present. (they should not be if the user did not create those tasks)
        """
        # register and login user
        self.register('Michael', 'michael@realpython.com', 'python', 'python')
        self.login('Michael','python')
        # go to tasks page, create a task, and logout
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()
        # register and login another user, check if tasks mgmt links are present
        self.register('CBG', 'CBG@CBG.com', '1234', '1234')
        self.login('CBG','1234')
        response = self.app.get('tasks/', follow_redirects=True)
        self.assertNotIn(b'Mark as complete', response.data)
        self.assertNotIn(b'Delete', response.data)
        
    def test_users_can_see_task_modify_links_for_tasks_created_by_them(self):
        """checks to see if links for 'Mark as complete' and 'Delete' tasks are
        present. They should not be if the user created them.
        """
        self.register('Michael', 'michael@realpython.com', 'python', 'python')
        self.login('Michael','python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()

        self.register('CBG', 'CBG@CBG.com', '1234', '1234')
        self.login('CBG','1234')
        self.app.get('tasks/', follow_redirects=True)
        response = self.create_task()
        self.assertIn(b'complete/2/', response.data)
        self.assertIn(b'complete/2/', response.data)
        
    def test_admin_users_can_see_task_modify_links_for_all_tasks(self):
        """checks to see if links for 'Mark as complete' and 'Delete' tasks are
        present. They should not be for the admin user.
        """
        self.register('Michael', 'michael@realpython.com', 'python', 'python')
        self.login('Michael','python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()

        self.create_admin_user()
        self.login('Superman', 'allpowerful')
        self.app.get('tasks/', follow_redirects=True)
        response = self.create_task()
        self.assertIn(b'complete/1/', response.data)
        self.assertIn(b'delete/1/', response.data)
        self.assertIn(b'complete/2/', response.data)
        self.assertIn(b'delete/2/', response.data)
        
    # ADMIN TASK MANAGEMENT

    def test_admin_users_can_complete_tasks_that_are_not_created_by_them(self):
        """admin user can complete task added by any other user"""
        # create a user, and have it create a task, then logout
        self.create_user('Michael', 'michael@realpython.com', 'python')
        self.login('Michael', 'python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()
        # create admin user, then try to complete the task (#1) created by 1st user
        self.create_admin_user()
        self.login('Superman', 'allpowerful')
        self.app.get('tasks/', follow_redirects = True)
        response = self.app.get("complete/1/", follow_redirects=True)
        self.assertNotIn('You can only update tasks that belong to you', response.data)

    def test_admin_users_can_delete_tasks_that_are_not_created_by_them(self):
        """admin user can delete task added by any other user"""
        # create a user, and have it create a task, then logout
        self.create_user('Michael', 'michael@realpython.com', 'python')
        self.login('Michael', 'python')
        self.app.get('tasks/', follow_redirects=True)
        self.create_task()
        self.logout()
        # create admin user, then try to delete the task (#1) created by 1st user
        self.create_admin_user()
        self.login('Superman', 'allpowerful')
        self.app.get('tasks/', follow_redirects = True)
        response = self.app.get("delete/1/", follow_redirects=True)
        self.assertNotIn('You can only delete tasks that belong to you', response.data)
       
    # ROLES
    
    def test_default_user_role(self):
        db.session.add(
            User("Johnny","john@doe.com","johnny")
        )
        db.session.commit()
        users = db.session.query(User).all()
        print users
        for user in users:
            self.assertEquals(user.role, 'user')
    
    def test_404_error(self):
        response = self.app.get('/this-route-does-not-exist/')
        self.assertEquals(response.status_code, 404)
        self.assertIn("There's nothing here!", response.data)

    '''
    
if __name__ == '__main__':
    unittest.main()