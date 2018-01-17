'''
Installs a little CLI that enables management of the admin DB from the command line
'''

from setuptools import setup

setup(
    name='fishfryform_db_manager',
    version='0.1',
    py_modules=['db_manager'],
    install_requires=[
        'Click',
    ],
    entry_points='''
        [console_scripts]
        bootstrap_db=db_manager:bootstrap_db
        create_user=db_manager:create_user
        create_role=db_manager:create_role
    ''',
)
