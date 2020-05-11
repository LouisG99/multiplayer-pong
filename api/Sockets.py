from flask import session
from flask_socketio import emit, join_room, leave_room, ConnectionRefusedError

from models import ActiveGames, ActivePlayers
from api import app, db, psql_session, socketio

import time

@socketio.on('my event')
def handle_my_custom_event(json):
  print('received json: ' + str(json))
  emit('ser', {'s': 123})


# @socketio.on('connect')
# def handle_new_connection():
#   print('new connection')
#   if 'username' not in session:
#     print('kashdk')
#     raise ConnectionRefusedError('not authenticated')
    
  
#   join_room(session['username'])

@socketio.on('disconnect')
def handle_disconnection():
  leave_room(session['username'])


# emit event to one client by sending it through its username room
def emit_private(event, data):
  emit(event, data, room=session['username'])


def get_player_index(user_id, game_id):
  user_player_query = ActivePlayers.query.filter_by(user_id=user_id, game_id=game_id)
  if user_player_query is not None:
    return user_player_query.playerIndex

  new_index = ActivePlayers.query.filter_by(game_id=game_id).count()
  return new_index


def add_as_active_player(game_id):
  user_id = session['user_id']
  playerIndex = get_player_index(user_id, game_id)
  newPlayer = ActivePlayers(user_id=user_id, game_id=game_id, playerIndex=playerIndex)

  session.add(newPlayer)
  session.commit()


@socketio.on('join game')
def handle_join_game_event(json):
  print(session)

  if 'socketRoom_id' not in json:
    return
  print(json['socketRoom_id'])
  game_id = json['socketRoom_id']

  game_query = ActiveGames.query.filter_by(id=game_id)
  if game_query is None:
    print("query none")
    # emit()
    pass
    return

  join_room(game_id)
  print('JOINED ROOM')

  # add_as_active_player(game_id)

  game_config = {
    'test': 5
  }
  # emit_private('game config', game_config)


  time.sleep(5)
  emit('all players ready', room=game_id)
  print('EMITTED')