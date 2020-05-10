import React, { useState, useEffect } from 'react';
import { sendPostRequest } from './utility';

function GameCodeDisplay(props) {


  return(
    <h2>{props.gameCode}</h2>
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
    
    const rawResponse = sendPostRequest('/api/create_game', 
      { numPlayers: numPlayers }
    );

    const content = await rawResponse.json();
  }

  return(
    <div>
      <h2>Create a game</h2>
      <input type="text" placeholder="Number of players" onChange={handleNumPlayersChange}/>
      <button type="submit" onClick={handleCreateGame}>Create Game</button>
      <GameCodeDisplay gameCode={numPlayers}/>
    </div>
  )
}

export default GameCreator;