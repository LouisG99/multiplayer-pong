import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { socketGame } from './SocketWrapper';
import PongInterface from './PongInterface';


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

  useEffect(() => {
    console.log('use effect')

    socketGame.connect();
    
    socketGame.socket.on('all players ready', handleAllPlayersReady);
    socketGame.socket.on('game config', data => handleGameConfig(data));
    socketGame.socket.on('invalid game code', handleInvalidGameCode);

    socketGame.joinGameRoom();

    return () => { // componentWillUnmount() equivalent
      socketGame.socket.close();
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