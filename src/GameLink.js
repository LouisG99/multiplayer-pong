import React, { useState, useEffect } from 'react';
import { sendPostRequest } from './utility';

import { socketGame } from './SocketWrapper';
import { Redirect } from 'react-router-dom';

function GameCodeDisplay(props) {
  const [gameCode, setGameCode] = useState('');
  const [redirect, setRedirect] = useState(false);

  function handleGameCodeChange(e) { setGameCode(String(e.target.value)) }
  function handleJoinGame() { 
    socketGame.gameCode = gameCode;
    setRedirect(true);
  }

  useEffect(() => {
    setGameCode(props.gameCode);
  }, [props.gameCode])

  if (redirect)
    return <Redirect to={{ pathname: '/game', state: {gameCode: gameCode} }}/>

  return(
    <div>
      <h2>Game Code is: {props.gameCode}</h2>
      <input type="text" placeholder="Game code" onChange={handleGameCodeChange} value={gameCode}/>
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

export { GameCreator };