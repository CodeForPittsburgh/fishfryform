# db

This folder contains resources to stand up a local copy of DynamoDB for development purposes.

## Prerequisites

* Java installed and able to be run from the command line

## Usage

* unzip the provided `dynamodb_local.zip` file to `/dynamodb_local`
* Run the provided `startup.bat` (Windows) or `startup.sh` (Mac or Linux) file
* in `/core/config.py`, set `DYNAMO_ENABLE_LOCAL = True`
* run the application per the development instructions in the README