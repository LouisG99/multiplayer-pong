import time;
import os;

from flask import Flask
from models import db, YourModel

def get_env_variable(name):
  try:
    return os.environ[name]
  except KeyError:
    message = "Expected environment variable '{}' not set.".format(name)
    raise Exception(message)


app = Flask(__name__)

# POSTGRESQL db config
POSTGRES_URL = get_env_variable("POSTGRES_URL")
POSTGRES_USER = get_env_variable("POSTGRES_USER")
POSTGRES_PW = get_env_variable("POSTGRES_PW")
POSTGRES_DB = get_env_variable("POSTGRES_DB")

DB_URL = 'postgresql+psycopg2://{user}:{pw}@{url}/{db}'.format(
  user=POSTGRES_USER,
  pw=POSTGRES_PW,
  url=POSTGRES_URL,
  db=POSTGRES_DB
)

app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # silence the deprecation warning
db.init_app(app)


import manage

@app.route('/time')
def get_current_time():
  return {'time': time.time()}

@app.route('/db')
def test_db():
  data = YourModel.query.all()
  print(data)
  return {'data': 'hello'}