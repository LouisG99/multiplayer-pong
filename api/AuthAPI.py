from flask import Blueprint, request
from api import app, db, session

auth_api = Blueprint('auth_api', __name__)

# def checkUserExists(username, pswd):



@auth_api.route('/api/login_user', methods=['POST'])
def login_user():
  print(request.form)
  return {'time': 5}