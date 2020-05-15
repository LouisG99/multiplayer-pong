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
    return user_player_query.index, user_player_query

  new_index = ActivePlayers.query.filter_by(game_id=game_id).count()
  return new_index, None


# Creates new record in Active Players if needed and returns index of player 
# based on order of connection (first-come, first-served)
def add_as_active_player(game_id):
  user_id = session['user_id']
  playerIndex, newPlayer = get_player_index(user_id, game_id)
  
  if newPlayer is None:
    newPlayer = ActivePlayers(user_id=user_id, game_id=game_id, index=playerIndex)
    psql_session.add(newPlayer)
    psql_session.commit()
  
  return playerIndex


def wait_and_game_on(game_id):
  from gameconfig import pointTimeoutPeriod
  time.sleep(pointTimeoutPeriod)
  emit('game on', room=game_id)
  print('game on')


def all_players_ready_alert(game_id):
  emit('all players ready', room=game_id)
  wait_and_game_on(game_id)
  

# asummes game_id valid as API is called before hand (/api/verify_game_id)
# and stored in session obj
@socketio.on('join game')
def handle_join_game_event():
  game_id = session['game_id']
    
  game_query = ActiveGames.query.filter_by(id=game_id).one_or_none()

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


@socketio.on('player rebound')
def handle_player_rebound(data):
  print(data)
  game_id = session['game_id']
  emit('player rebound', data, room=game_id, include_self=False)


# if game done -> return ActivePlayer object of winner
# else -> return None
def get_game_winner(query_shell, game_id):
  players = query_shell.all()
  maxPlayer = query_shell[0]

  for player in players:
    if player.score > maxPlayer.score:
      maxPlayer = player

  pointLimit = psql_session.query(ActiveGames).\
               filter_by(id=game_id).one().pointLimit

  return maxPlayer if (pointLimit == maxPlayer.score) else None


# clean up ActiveGames and ActivePlayers
def handle_end_game(game_id, maxActivePlayer):
  winnerUser = maxActivePlayer.user

  psql_session.query(ActivePlayers).filter_by(game_id=game_id).delete()
  psql_session.query(ActiveGames).filter_by(id=game_id).delete()
  psql_session.commit()

  emit('game end', { 'winner': winnerUser.username }, room=game_id)


#update scores of other players (player wins a point everytime another misses)
# return true if game continues, false if game is done (max score reached)
def update_player_scores(game_id, user_id):
  query_shell = psql_session.query(ActivePlayers).\
    filter(ActivePlayers.game_id == game_id).\
    filter(ActivePlayers.user_id != user_id)
  query_shell.update({ 'score': ActivePlayers.score + 1 })

  maxActivePlayer = get_game_winner(query_shell, game_id)
  if maxActivePlayer is not None: # game done
    handle_end_game(game_id, maxActivePlayer)

  psql_session.commit()
  return maxActivePlayer is None


@socketio.on('player lost point')
def handle_player_lost_point():
  print('player lost point', session)

  game_id = session['game_id']
  user_id = session['user_id']

  if update_player_scores(game_id, user_id): # game goes on
    wait_and_game_on(game_id)

# cacaab38-ab5d-44dd-8ced-a4c26d49a0a6