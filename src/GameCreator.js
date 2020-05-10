import React, { useState, useEffect } from 'react';
import { sendPostRequest } from './utility';

import socket from './Sockets';

function GameCodeDisplay(props) {
  if (!props.gameCode) return null;

  function handleJoinGame() {
    socket.emit('join game', { socketRoom_id: props.gameCode })
  }

  return(
    <div>
      <h2>Game Code is: {props.gameCode}</h2>
      <button onClick={handleJoinGame}>Join Game</button>
    </div>
  )
}

function GameCreator() {
  const [numPlayers, setNumPlayers] = useState(null);
  const [gameCode, setGameCode] = useState(null)

  function handleNumPlayersChange(e) { setNumPlayers(Number(e.target.value)) }

  async function handleCreateGame() {
    if (!Number.isInteger(numPlayers)) {
      alert('Enter an integer number')
      return;
    }
    
    const rawResponse = await sendPostRequest('/api/create_game', 
      { num_players: numPlayers }
    );

    const content = await rawResponse.json();
    setGameCode(content.socketRoom_id)
    console.log(content)
  }

  return(
    <div>
      <h2>Create a game</h2>
      <input type="text" placeholder="Number of players" onChange={handleNumPlayersChange}/>
      <button type="submit" onClick={handleCreateGame}>Create Game</button>
      <GameCodeDisplay gameCode={gameCode}/>
    </div>
  )
}

export default GameCreator;