#!/bin/sh

set -e # stops exe if cmd or pipeline has error

source .flaskenv_export

# flask resetdb
gunicorn -c gunicorn_config.py api:app