from flask import session
from flask_socketio import emit, join_room, leave_room

from models import ActiveGames
from api import app, db, psql_session, socketio


@socketio.on('my event')
def handle_my_custom_event(json):
  print('received json: ' + str(json))
  emit('ser', {'s': 123})


@socketio.on('join game')
def handle_join_game_event(json):
  print(json['socketRoom_id'])
  game_id = json['socketRoom_id']

  game_query = ActiveGames.query.filter_by(id=game_id)
  if game_query is None:
    # emit()
    pass

  else:
    join_room(game_id)
    print('joined roo,')