# Fish Fry Form

This is a web form for cataloging the rich array of Lenten Fish Fry events that occur every spring in Western Pennsylvania. It is an extension of the [Fish Fry Map](https://codeforpittsburgh.github.io/fishfrymap), the brainchild of Hollen Barmer.

It is built with a bunch of off-the-shelf open-source stuff, including [CARTO](https://carto.com/), to make data entry quick and spatial and painless.

![screenshot of form](https://raw.githubusercontent.com/CodeForPittsburgh/fishfryform/master/docs/prototype1.PNG)

# Quick Start

1. Clone the repo
  ```
  git clone https://github.com/...
  cd allfacilities
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

# Architecture

## App

On the server-side, this is a lean Python Flask app built from the RealPython **Flask Boilerplate** project: https://github.com/mjhea0/flask-boilerplate/

On the client-side, this is a vanilla Bootstrap web site with jQuery and other stuff to help ensure cross-browser compatibility.

## Data

All data for this project is stored on CARTO, which uses a PostGIS-enabled Postgresql database for geodata storage. Calls are made to the database using the CARTO SQL API.

Data is stored in two tables:
* **Venues table**: describes each venue, and includes geo-attributes.
* **Events table**: stores all dates/times for every events for every venue. Non-spatial. Related to venues table via a Venue ID field.

# Tests

TBC

# Deployment

## Deployment to Heroku

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

### What's next?

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
