# Fish Fry Form

**Fish Fry Form** is a web form and API for cataloging and accessing the rich array of Lenten Fish Fry events that occur every spring in Western Pennsylvania. It is an extension of the [Fish Fry Map](https://codeforpittsburgh.github.io/fishfrymap), the brainchild of [Hollen Barmer](https://twitter.com/hollenbarmer).

The Fish Fry Form is the entry point for editing and accessing the Fish Fry Map. It is both an actual graphic user interface (GUI) for accessing and editing Fish Fry map data (as a simple little web application), and an application programming interface (API) for doing the same. It enables a consistent method for soliciting input and curating data for the Fish Fry Map.

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

# Technical Overview

(to be updated)

## A. Client-side

### Software

### Structure

Fish Fry data is stored in two tables:

* **Venues table**: describes the characteristics of each venue and its events, and includes geo-attributes.
* **Events table**: stores the dates/times for every event for every venue. This table is non-spatial. It is related to venues table via a Venue ID field.

While normally dealing with two tables that have a one-to-many relationship requires SQL skills beyond the 101-level, you don't have to worry about that here. We take care of getting all the data for you with the **Fish Fry API**.

# Fish Fry API

The Fish Fry API provides some basic `GET` access to the Fish Fry database. Full CRUD access is planned!

# Development

So you want to clone or fork this thing and get it running yourself? Have at it. The steps below assume you have a **Python 3.4** installation on your machine and you can run `python` and `pip` commands (or whatever aliases you've configured for for Python 3) from the command line, as well as `git` commands. This was built with Python 3.4 on Windows 10.

(For the uninitiated Windows user, we recommend pairing the official Python 3 installer from [python.org](https://www.python.org/) with a Windows console emulator like **Cmder** w/Git-for-Windows )

1. Clone this repository

```
git clone https://github.com/CodeForPittsburgh/fishfryform.git
cd fishfryform
```

2. Install [`pipenv`](https://docs.pipenv.org), a Python package that combines package management and virtual environment management in one place.

`pip install pipenv`

3. Install dependencies in a virtual environment

3a. If you're not on Windows, skip this step; otherwise: download the Shapely wheel file for your OS variant from https://www.lfd.uci.edu/~gohlke/pythonlibs/#shapely, and install it using pip:

`pip install "C:\Users\YourUser\Downloads\Shapely-1.5.17-cp34-cp34m-win_amd64.whl"`

3b. Get a Python `pipenv` virtual environment running with required dependencies (if you're not on Windows this will work without step 3a):

```
$ pipenv install
```

This will find the `requirements.txt` file and install dependencies

4. Run the development server:

```
$ pipenv run python application.py
```

6. Navigate to [http://localhost:5000](http://localhost:5000)


## Tests

To be completed.

## Deployment

There are many ways to deploy this application. [PythonAnywhere](https://www.pythonanywhere.com/) provides a great place for deploying Flask applications like this; the previous version (2017) was deployed there. This one is being deployed to AWS Elastic Beanstalk.

### Deployment to AWS Elastic Beanstalk

Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html) guide for deployment.

As of this writing, AWS Elastic Beanstalk supports Python 3.4.
