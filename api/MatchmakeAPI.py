from flask import Blueprint, request, session
from api import app, db, psql_session
from models import Users, ActiveGames

MIN_NUMPLAYERS = 1
MAX_NUMPLAYERS = 10

matchmake_api = Blueprint('matchmake_api', __name__)


@matchmake_api.route('/api/create_game', methods=['POST'])
def create_game():
  if 'user_id' not in session:
    return { 'success': False, 'message': 'User not logged in' }

  num_players = request.json['num_players']
  if num_players < MIN_NUMPLAYERS or num_players > MAX_NUMPLAYERS:
    return { 'success': False, 'message': 'Incorrect game config' }

  user_id = session['user_id']
  new_activeGame = ActiveGames(
    numPlayers=num_players# , pointLimit=default, i.e. 5
  )
  psql_session.add(new_activeGame)
  psql_session.commit()

  socketRoom_id = new_activeGame.id

  return { 'success': True, 'socketRoom_id': socketRoom_id }

  
# check game_id is valid and sets session to contain the game_id 
# (also room id) for future socket communications
@matchmake_api.route('/api/verify_game_id', methods=['GET'])
def verify_game_id():
  user_id = session.get('user_id')
  game_id = request.args.get('game_id')

  try:
    game_query = ActiveGames.query.filter_by(id=game_id).first()
  except:
    game_query = None
  
  if game_query is None:
    return { 'success': False, 'message': 'Game code is invalid' }
  
  session['game_id'] = game_query.id
  print('verify game id:', session)
  return { 'success': True }
