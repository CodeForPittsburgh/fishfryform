# Fish Fry Form

**Fish Fry Form** is a web form and API for cataloging and accessing the rich array of Lenten Fish Fry events that occur every spring in Western Pennsylvania. It is an extension of the [Fish Fry Map](https://codeforpittsburgh.github.io/fishfrymap), the brainchild of [Hollen Barmer](https://twitter.com/hollenbarmer).

The Fish Fry Form is the entry point for editing and accessing the Fish Fry Map's *data*. It is both an actual graphic user interface (GUI) for accessing and editing Fish Fry map data (as a simple little web application), and an application programming interface (API) for doing the same. It enables a consistent method for soliciting input and curating data for the Fish Fry Map. It has also been designed to ensure is the map and data entry interfaces can be database-agnostic.

---

# Fish Fry Curation Primer

In setting this project up, we wanted to accomplish something that hadn't been done in the past: put the power of adding Fish Frys to the map into the hands of everyone.

We also wanted to make sure the data is reliable, since hopefully people will be using it to select which Fish Fry they might attend. We don't, for instance, want to inadvertently send people to a Fish Fry where they think they'll be able to enjoy an ice cold beer in addition to homemade pierogies at lunch on a Friday afternoon, but in fact find out that not only does the venue not serve alcohol, but it's closed for lunch.

So, we've created a process layer between open submission and formal publication; a QA/QC or data curation process. This is how that works:

1. An anonymous user of the Fish Fry Form submits an entry. In the database, two fields, `validated` and `published` are set to `FALSE` by default.
2. Someone on the Fish Fry Team responsible for scrubbing the data looks at the database, makes sure things at the very least are not a mess, and/or cleans up any mistakes or misinformation, and switches `validated` to `TRUE`.
3. Someone (maybe the same person, but maybe not) looks at all records where `validated` equals `TRUE`. Since this is all supposed to be for a map, this person may then only be responsible for checking the address/geocoding and make sure it all jives. Then they switch `published` to `TRUE`.

For us, the Fish Fry people, the point of having this two-step validation-publication check is practical: we're going to be starting with last year's Fish Fry venues, which we need to first update (validate) for this year, and then, since timelines for this are tight, need to quickly yay/nay for display to the map (publish). Then, presumably next year we will do the same.

---

# Fish Fry API Usage

The Fish Fry API provides some basic `GET` access to the Fish Fry database, and full CRUD access for administrators.

See the complete API documentation [here]("https://fishfry.codeforpgh.org/apidocs").

---

# Software Overview

This a pretty rote Python Flask application, with (a bunch of) plugins to make it punch above its weight.

_Note: An earlier iteration of this application (built for the 2017 Lenten season used CARTO for the database and had a lot of client-side javascript. It was all very messy and bad, thus the 2018 refactor._

## Adminstration UI

`Flask-Admin` provides a quick way to manage users and roles. For this application,
users are stored in a `sqlite` database; `SQLAlchemy` talks to that database for `Flask-Admin`.

## API and API UI

For ReST-ful access to the data, we're using `Flask-ReSTful` and `Flasgger` (a `Swagger` UI generator for Flask). The former simplifies API design; the latter provides a way to automatically generate API documentation (among other things).

## Database

Fish Fry data is stored as the features array of a `geojson` FeatureCollection in AWS DynamoDB. Schema and validation is managed at the application-level with `Marshmallow`, with further management provided for the form itself by `WTForms`.

To talk to DynamoDB, we've put some calls made using the AWS `boto3` library behind a simple *abstraction layer* (`core/api/db_interface`). This makes CRUD requests easy; it also keeps our ReST-ful API logic separate from the database API (in case we need to switch databases again).

---

# Development

So you want to clone or fork this thing and get it running yourself? Have at it. The steps below assume you:

* have a **Python 3.5+** installation on your machine
* can run `python` and `pip` commands (or whatever aliases you've configured for for Python 3) from the command line
* have `git` installed and can run some basic `git` commands
* have `node`, `npm`, and `gulp` installed, for running tasks. This isn't strictly required for development, unless you plan to work with the client side `javascript` or `css`.

This was built with Python 3.5 on Windows 10. Since Python on Windows can sometimes be a pain, we recommend pairing the official Python 3 installer from [python.org](https://www.python.org/) with a Windows console emulator like **Cmder** w/Git-for-Windows)

### 1. Clone this repository

```
git clone https://github.com/CodeForPittsburgh/fishfryform.git
cd fishfryform
```

### 2. Install [`pipenv`](https://docs.pipenv.org)

It's a Python package that combines package management and virtual environment management in one place.

```
pip install pipenv
```

### 3. Install dependencies in a virtual environment

Get a Python `pipenv` virtual environment running with required dependencies:

```
$ pipenv install
```

This command finds the `requirements.txt` file and installs dependencies.

### 4. Turn on the database

Unzip the local Dynamo DB database provided in `/tests/dynamodb_local.zip`.

Run the `startup.bat` file found in the unzipped folder. That will spin up a test database with some old Fish Fry data loaded up.

### 5a. For development related to Python-Flask only:

Run just the Python Flask application:

```
$ pipenv run python application.py
```

Navigate to [http://localhost:5000](http://localhost:5000) to see the site.

### 5b. To work on real client side stuff (javascript- and css- related):

Skip Step 5a. Run:

```
$ gulp
```

This will work some magic on the files in the `src` folder, put them where the Flask application expects them to be, fire up `application.py`, watches for changes to `js` and `css` files in `src`, and starts `browser-sync`. It should automatically open the browser for you; if not, navigate to [http://localhost:3000](http://localhost:3000) to see the site.

It doesn't fire up the database (Step 4), so make sure that's running in the background (in another command line console) before you start.

## Tests

Some basic Python unit tests are in the `tests` folder (`test_*.py`). Coverage is low at the moment; it's a WIP.

## Deployment

There are many ways to deploy this application. [PythonAnywhere](https://www.pythonanywhere.com/) provides a great place for deploying Flask applications like this. This one could also easily by deployed to AWS Elastic Beanstalk.

### Deployment to AWS Elastic Beanstalk

Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html) guide for deployment.

As of this writing, AWS Elastic Beanstalk supports Python 3.4.
