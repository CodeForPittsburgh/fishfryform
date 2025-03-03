'''
db_manager.py

Stuff for standing up the admin database. CLI provided by Python-Click.

'''
import click

from flask_security.utils import encrypt_password

from core import application as app
from core import application_db as db
from core.admin import user_datastore
from core.models import Role
from core.api.db_interface import get_all_fishfries
from datetime import datetime
from pathlib import Path
import json


# ---------------------------------------------------------
# helpers

def create_user(email, password, role):
    """Create a new user in the database

    Arguments:
        email {[type]} -- [description]
        password {[type]} -- [description]
        role {[type]} -- [description]

    Returns:
        An instance of the User model
    """

    new_user = user_datastore.create_user(
        email=email,
        password=encrypt_password(password),
        roles=[role]
    )
    db.session.commit()
    return new_user


def create_role(role):
    """[summary]

    Arguments:
        role {string} -- [description]

    Returns:
        instance of Role model
    """

    new_role = Role(name=role)
    db.session.add(new_role)
    db.session.commit()
    return new_role


# ---------------------------------------------------------
# commands

@click.group()
def manage_db():
    pass


@click.command()
@click.option('--role', prompt=True)
def new_role(role):
    create_role(role)


@click.command()
@click.option('--email', prompt=True)
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True)
@click.option('--role', prompt=True, type=click.Choice(['admin', 'contributor']))
def new_user(email, password, role):
    create_user(email, password, role)


@click.command()
@click.confirmation_option(help='Are you sure you want to create a fresh database? This will overwrite any existing database specified in "/core/config.py"')
def bootstrap_db():
    '''This stands up a completely fresh user database for the admin-side of the application, with a test admin and test contributor. Use for dev/testing.

    NOTE: This uses the database path specified in /core.config.py. It will overwrite the existing application database tables unless you've pointed the 'core/config.py' file to point to another sqlite database.
    '''

    with app.app_context():

        #---------------------------------------#
        # FRESH DB

        click.echo("Dropping tables...")
        db.drop_all()
        click.echo("Creating fresh tables...")
        db.create_all()

        #---------------------------------------#
        # CREATE ROLES in ROLES TABLE
        click.echo("Creating roles...")
        role_admin = create_role('admin')
        role_contributor = create_role('contributor')

        #---------------------------------------#
        # CREATE USERS in USERS TABLE
        test_users = [
            {
                "email": "admin@test.net",
                "password": "adm1nt3st",
                "role": role_admin,
            }, {
                "email": "contrib@test.net",
                "password": "contr1bt3st",
                "role": role_contributor,
            }
        ]

        for user in test_users:
            new_user = create_user(
                email=user['email'],
                password=user['password'],
                role=user['role'],
            )
            click.echo("Created user {0}".format(new_user.email))
    return

@click.command()
@click.option('--path')
def dump_geojson(path):
    fries = get_all_fishfries()
    out_file = Path(path) / "fishfry_{0}.geojson".format(datetime.now().strftime('%Y%d%mT%H%M%S'))
    with open(str(out_file), 'w') as fp:
        json.dump(fries, fp)
    click.echo("dumped fishfries to {0}".format(str(out_file)))

manage_db.add_command(new_user)
manage_db.add_command(new_role)
manage_db.add_command(bootstrap_db)
manage_db.add_command(dump_geojson)

if __name__ == '__main__':
    manage_db()
