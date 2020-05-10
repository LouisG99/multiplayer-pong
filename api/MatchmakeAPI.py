from flask import Blueprint, request, session
from api import app, db, psql_session
from models import Users, ActiveGames

MIN_NUMPLAYERS = 2
MAX_NUMPLAYERS = 2

matchmake_api = Blueprint('matchmake_api', __name__)


@matchmake_api.route('/api/create_game', methods=['POST'])
def create_game():
  if 'user_id' not in session:
    return { 'success': False, 'message': 'User not logged in' }

  num_players = request.json['num_players']
  if num_players < MIN_NUMPLAYERS or num_players > MAX_NUMPLAYERS:
    return { 'success': False, 'message': 'Incorrect game config' }

  user_id = session['user_id']
  new_activeGame = ActiveGames(numPlayers=num_players)
  psql_session.add(new_activeGame)
  psql_session.commit()

  socketRoom_id = new_activeGame.id

  return { 'success': True, 'socketRoom_id': socketRoom_id }

  
