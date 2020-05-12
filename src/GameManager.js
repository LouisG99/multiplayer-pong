import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { socketGame } from './SocketWrapper';
import PongInterface from './PongInterface';
import { sendGetRequest } from './utility';


function GameManager(props) {
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);
  const [gameConfig, setGameConfig] = useState({});
  const [redirectHome, setRedirectHome] = useState(false);

  function handleAllPlayersReady() {
    alert('Players Ready');
    setWaitingForPlayers(false);
  }

  function handleGameConfig(config) {
    console.log('config received')
    console.log(config);
    setGameConfig(config);
  }

  function handleInvalidGameCode() {
    alert("Game code was invalid, you'll be redirected");
    setRedirectHome(true);
  }

  async function verifyGameId() {
    console.log('verifyGameId')
    let encodedGameCode = encodeURIComponent(socketGame.gameCode);
    let APIurl = `/api/verify_game_id?game_id=${encodedGameCode}`;

    const rawResponse = await sendGetRequest(APIurl);
    const content = await rawResponse.json();
    return content;
  }

  function socketInit() {
    socketGame.connect(); // session copied here

    socketGame.socket.on('all players ready', handleAllPlayersReady);
    socketGame.socket.on('game config', data => handleGameConfig(data));
    socketGame.socket.on('invalid game code', handleInvalidGameCode);

    socketGame.socket.emit('join game'); // game_id stored in session
  }

  useEffect(() => {
    console.log('use effect')

    verifyGameId().then(data => {
      if (!data.success) alert('Invalid code, try again');
      else socketInit()
    })
      
    return () => { // componentWillUnmount() equivalent
      if (socketGame.socket) socketGame.socket.close();
    }
  }, [])


  if (redirectHome) return <Redirect to='/'/>

  return (
    <div>
      <h2>Game Manager {socketGame.gameCode}</h2>
      <PongInterface 
        waitingForPlayers={waitingForPlayers}
        gameConfig={gameConfig}
        />
    </div>

  )
}

export default GameManager;