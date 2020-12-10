#!/bin/sh

set -e # stops exe if cmd or pipeline has error

source .flaskenv_export

flask resetdb # needed for swarm or will fail
gunicorn -c gunicorn_config.py api:app