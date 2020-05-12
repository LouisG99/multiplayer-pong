from flask_socketio import emit, join_room, leave_room, ConnectionRefusedError
from sqlalchemy.dialects.postgresql import UUID

from models import ActiveGames, ActivePlayers
from api import app, db, psql_session, socketio

import time

@socketio.on('my event')
def handle_my_custom_event(json):
  print('received json: ' + str(json))
  emit('ser', {'s': 123})


from flask import session, request

@socketio.on('connect')
def handle_new_connection():
  print('Connect', session)
  if 'username' not in session:
    print('kashdk')
    raise ConnectionRefusedError('not authenticated')
    
  join_room(session['username'])


@socketio.on('disconnect')
def handle_disconnection():
  print('disconnected')
  leave_room(session['username'])


# emit event to one client by sending it through its username room
def emit_private(event, data):
  emit(event, data, room=session['username'])


def get_player_index(user_id, game_id):
  user_player_query = ActivePlayers.query.filter_by(user_id=user_id, game_id=game_id).first()
  if user_player_query is not None:
    return user_player_query.playerIndex, user_player_query

  new_index = ActivePlayers.query.filter_by(game_id=game_id).count()
  return new_index, None


# Creates new record in Active Players if needed and returns index of player 
# based on order of connection (first-come, first-served)
def add_as_active_player(game_id):
  user_id = session['user_id']
  playerIndex, newPlayer = get_player_index(user_id, game_id)
  
  if newPlayer is None:
    newPlayer = ActivePlayers(user_id=user_id, game_id=game_id, playerIndex=playerIndex)
    psql_session.add(newPlayer)
    psql_session.commit()
  
  return playerIndex


def all_players_ready_alert(game_id):
  emit('all players ready', room=game_id)


# asummes game_id valid as API is called before hand (/api/verify_game_id)
# and stored in session obj
@socketio.on('join game')
def handle_join_game_event():
  game_id = session['game_id']
  try:
    game_query = ActiveGames.query.filter_by(id=game_id).first()
  except:
    game_query = None

  join_room(game_id)
  print('JOINED ROOM')
  
  from gameconfig import config
  game_config = config.copy()
  game_config['playerIndex'] = add_as_active_player(game_id)
  emit_private('game config', game_config)

  if game_config['playerIndex'] == game_query.numPlayers-1:
    all_players_ready_alert(game_id)


@socketio.on('player move')
def handle_player_move(data):
  game_id = session['game_id']

  emit('player move', data, room=game_id, include_self=False)
  print('player moved, change broadcatsed')