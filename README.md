# Fish Fry Form

**Fish Fry Form** is some web software for cataloging and accessing the rich variety of Lenten Fish Fry events that occur every spring in Western Pennsylvania. It is an extension of the [Fish Fry Map](https://codeforpittsburgh.github.io/fishfrymap), the brainchild of [Hollen Barmer](https://twitter.com/hollenbarmer).

The Fish Fry Form is the entry point for editing and accessing the Fish Fry Map. It is both an actual graphic user interface (GUI) for accessing and editing Fish Fry map data (as a simple little web application), and an application programming interface (API) for doing the same. It enables a consistent method for soliciting input and curating data for the Fish Fry Map.

![screenshot of form](https://raw.githubusercontent.com/CodeForPittsburgh/fishfryform/master/docs/prototype1.PNG)

## Why create a special form?

*Why not just use Google Forms or Survey Monkey or something?*

Because the Fish Fry, as a Western Pennsylvanian phenomenon, is special--so it deserves special treatment.

Also--in looking at the off-the-shelf software options for data management, it was tough to find the right combination of features:

* easy-to-use interface for the layperson
* robust programmatic entry points for the power user
* spatially- and temporally-rigorous database
* backed by easy-to-build-with open mapping software for the web

So, as silly as it may seem, Fish Fry Form has sort-of been built from scratch. Actually, it just combines a bunch of off-the-shelf open-source software, including [CARTO](https://carto.com/), to make data entry quick and spatial and painless for the majority of people, while also ensuring the `!33t h@x0r5` don't have to touch a mouse if they don't want.

The goal with pulling together this software stack was also to give Code for Pittsburgh something useful for other projects, which often involve collecting information and mapping at some level.

---

# Fish Fry Curation Primer

In setting this project up, we wanted to accomplish something that hadn't been done in the past: put the power of adding Fish Fries to the map into the hands of everyone.

We also wanted to make sure the data is reliable, since hopefully people will be using it to select which Fish Fry they might attend. We don't, for instance, want to inadvertently send people to a Fish Fry where they think they'll be able to enjoy an ice cold beer in addition to homemade pierogies at lunch on a Friday afternoon, but in fact find out that not only does the venue not serve alcohol, but it's closed for lunch.

Of course, this is also 2017 and not everyone uses the Internet with Good Intentions, so we need to just make sure that the proverbial 400-lb-guy-in-his-parents'-basement isn't feeding us Fake News about Fish Fries.

So, we've created a process layer between open submission and formal publication; a QA/QC or data curation process. This is how that works:

1. A user of the Fish Fry Form submits a entry. In the database, two fields, `validated` and `published` are set to `FALSE` by default.
2. Someone on the Fish Fry Team responsible for scrubbing the data looks at the database, makes sure things at the very least are not a mess, and/or cleans up any mistakes or misinformation, and switches `validated` to `TRUE`.
3. Someone (maybe the same person, but maybe not) looks at all records where `validated` equals `TRUE`. Since this is all supposed to be for a map, this person may then only be responsible for checking the address/geocoding and make sure it all jives. Then they switch `published` to `TRUE`.

For us, the Fish Fry people, the point of having this two-step validation-publication check is practical: we're going to be starting with last year's Fish Fry venues, which we need to first update (validate) for this year, and then, since timelines for this are tight, need to quickly yay/nay for display to the map (publish). Then, presumably next year we will do the same.

*[This year, the validation ability will be turned on for everyone at the Fish Fry Potluck on Feb 23, which will help us update things quickly. Then the only curation step handled by CfP will be for publication]*

---

# Technical Overview

This entire web application began life as a clone of the [RealPython Flask Boilerplate project](https://github.com/mjhea0/flask-boilerplate/), which provides a well-documented starting point for a project like this.

## A. Client-side

### Software

On the client-side, the web application relies on the [Bootstrap](http://getbootstrap.com/) framework for the user interface. jQuery and some jQuery plugins are used for rote client-side scripting. Both along with some other little off-the-shelf things help to ensure cross-browser support.

### Structure

The website itself is comprised of 5 pages.

1. **Home**: Overview of the project. Navigation options to get to **Use & Map** or **Contribute** pages.
2. **Use & Map** Page: This page demonstrates, with an example web map, how to access and display the Fish Fry data using the API. It's not the official Fish Fry Map, but a demonstration of how to build one.
3. **Contribute** Page: This page is an entry point for adding new Fish Fries or editing existing ones. It contains two main elements:
    * An **Add New** Button, which takes you to the actual **Fish Fry Form**.
    * A big, sortable, searchable table of existing Fish Fries in the database. Each record represents a single Fish Fry venue and whether it has been validated and/or published. Select a record and click the **Edit Existing** Button to load that Fish Fry into the **Fish Fry Form**.
4. **Fish Fry Form**: A glorified data entry form. It's blank if you're starting with a new entry; it's pre-populated if you're editing an existing Fish Fry. As many sensible defaults are set as possible, and enough free-form text fields are available to please the wordiest of novelists. Each form is used to manage Fish Fry characteristics for a single venue; each venue can have multiple Fish Fry events recorded here.
5. **Adminstrator Form**: For the Fish Fry Team, a page that contains a big table of the data that can be used to validate and publish data. This one is not publicly accessible.

## B. Server-side

On the server-side, the web application is built using the [Python Flask](http://flask.pocoo.org/) framework. This handles:

* models: for interacting with the database
* views: page templates
* controllers: page routing and business logic for parsing data requested and submitted by end-users

This is called a Model-View-Controller (MVC) approach. We keep the interface elements (views) separate from the business logic (controllers), separate from the tools for interacting with the database (models). This lets us build and maintain individual components more easily. It also makes it straightforward to build an API from the same code that serves up the web pages.

## C. Database

### Software

Typically, a simple Flask application like this is paired with a SQL database (usually SQLite or PostgreSQL) that runs next to the web server on the same machine. Not this one!

Rather than bother with setting that up, all data used for this app is stored on [CARTO](https://carto.com/). Why? On the backend, CARTO uses a PostGIS-extended PostgreSQL database for geodata storage, and they provide a nice API of their own for interacting with that database.

Since only our *model* code contains the logic for talking the database, should we decided to use another geo-platform in the future (say, Mapbox or Esri or something else), this choice is no big deal.

### Structure

In CARTO, our Fish Fry data is stored in two tables:

* **Venues table**: describes the characteristics of each venue and its events, and includes geo-attributes.
* **Events table**: stores the dates/times for every event for every venue. This table is non-spatial. It is related to venues table via a Venue ID field.

While normally dealing with two tables that have a one-to-many relationship requires SQL skills beyond the 101-level, you don't have to worry about that here. We take care of getting all the data for you with the **Fish Fry API**.

# Fish Fry API

*These are just draft API calls!*

The Fish Fry API is a collection of simple functions embodied in web endpoints that allow you to access and manipulate Fish Fry data.

We may require an API key to access this, which we will hand out when requested.

### Get Fish Fries

* `GET /api/fishfries`: returns a `geojson` Feature Collection of all Fish Fries. Included is a unique identifier (`uid`) created in the database, which you can use to retrieve or edit individual Fish Fries. Additional optional query string parameters include:
    * `valid=True/False`: returns validated data, default is True
    * `publish=True/False`: returns data marked for publication, default is True

* `GET /api/fishfries/{uid}`: returns a `geojson` Feature of the Fish Fry indicated by the `{uid}`. 

### Create Fish Fries

* `POST /api/fishfries/new?fishfry={json}`: submit a new Fish Fry.

### Edit Fish Fries

* `PUT /api/fishfries/{uid}?fishfry={json}`: edit an existing Fish Fry. The submission will overwrite existing attributes with whatever you submit. It assumes that you know what you are doing. If you leave an attribute blank that is populated in the database, that attribute gets wiped in the database.

### Delete Fish Fries

* `PUT /api/fishfries/{uid}/delete: (Maybe?) doesn't actually delete a Fish Fry from the database, but sets its validation and publication status to `FALSE` so that it disappears from any map.

# Development

So you want to clone or fork this thing and get it running yourself? Have at it. Follow the steps below.

## Quick Start

1. Clone the repo

```
git clone https://github.com/...
cd fishfryform
```

2. Initialize and activate a Python virtualenv:

```
$ virtualenv env
$ env/Scripts/activate
```

3. Install the dependencies with Python Pip:

```
$ pip install -r requirements.txt
```

5. Run the development server:

```
$ python run.py
```

6. Navigate to [http://localhost:5000](http://localhost:5000)



## Tests

To be completed.

## Deployment

### Deployment to Heroku

*note: this is boilerplate from the Flask Boilerplate project and has not been tested for this one*

1. Signup for [Heroku](https://api.heroku.com/signup)
2. Login to Heroku and download the [Heroku Toolbelt](https://toolbelt.heroku.com/)
3. Once installed, open your command-line and run the following command - `heroku login`. Then follow the prompts:

```
Enter your Heroku credentials.
Email: name@domain.org
Password (typing will be hidden):
Could not find an existing public key.
Would you like to generate one? [Yn]
Generating new SSH public key.
Uploading ssh public key /Users/yourusername/.ssh/id_rsa.pub
```

4. Activate your virtualenv
5. Heroku recognizes the dependencies needed through a *requirements.txt* file. Create one using the following command: `pip freeze > requirements.txt`. Now, this will only create the dependencies from the libraries you installed using pip. If you used easy_install, you will need to add them directly to the file.
6. Create a Procfile. Open up a text editor and save the following text in it:

```
web: gunicorn app:app --log-file=-
```

   Then save the file in your applications root or main directory as *Procfile* (no extension). The word "web" indicates to Heroku that the application will be attached to the HTTP routing stack once deployed.

7. Create a local Git repository (if necessary):

```
$ git init
$ git add .
$ git commit -m "initial files"
```

8. Create your app on Heroku:

```
$ heroku create <name_it_if_you_want>
```

9. Deploy your code to Heroku:

```
$ git push heroku master
```

10. View the app in your browser:

```
$ heroku open
```

11. You app should look similar to this - [http://www.flaskboilerplate.com/](http://www.flaskboilerplate.com/)

12. Having problems? Look at the Heroku error log:

```
$ heroku logs
```

#### What's next?

1. Using Heroku? Make sure you deactivate your virtualenv once you're done deploying: `deactivate`
2. Need to reactivate?
    * Windows: `env\Scripts\activate`,
		* Unix: `source env/bin/activate`
4. Add your Google Analytics ID to the `html` files in the `templates\layouts` directory
5. Add a domain name to [Heroku](https://devcenter.heroku.com/articles/custom-domains)


# Credits

* Template from RealPython's **Flask Boilerplate** project: https://github.com/mjhea0/flask-boilerplate/
* Inspired by:
  * http://clhenrick.github.io/2015/10/07/using-cartodb-and-datatables/
  * http://fulcrumapp.github.io/geojson-dashboard/
