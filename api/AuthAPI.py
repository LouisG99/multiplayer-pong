from flask import Blueprint, request, session
from api import app, db, psql_session
from models import Users

auth_api = Blueprint('auth_api', __name__)


def getUserRecord(username):
  return Users.query.filter_by(username=username).first()


@auth_api.route('/api/login', methods=['POST'])
def login_user():
  username = request.json['username']
  password = request.json['password']
  userRecord = getUserRecord(username)

  if userRecord is None:
    return { 'success': False, 'message': 'User does not exist' }
  elif userRecord.password == password:
    session['username'] = username
    session['user_id'] = userRecord.id
    return { 'success': True }
  else:
    return { 'success': False, 'message': 'Incorrect user/password combination' }


@auth_api.route('/api/logout', methods=['GET'])
def logout_user():
  if 'username' in session:
    del session['username']
  if 'user_id' in session:
    del session['user_id']

  return { 'success': True }


@auth_api.route('/api/signup', methods=['POST'])
def signup_user():
  username = request.json['username']
  password = request.json['password']
  # if len(username) > 20 or len(password) > 20:
  #   return { 'success': False, 'message': 'Username not available' }
  if getUserRecord(username) is not None:
    return { 'success': False, 'message': 'Username not available' }
  
  newUser = Users(username=username, password=password)
  psql_session.add(newUser)
  psql_session.commit()
  return { 'success': True }