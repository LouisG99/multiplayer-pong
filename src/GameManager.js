import React, { useState, useEffect } from 'react';

import { socketGame } from './SocketWrapper';
import PongInterface from './PongInterface';

// socketGame.socket.on('game ready', GameManager.handleGameStart);

function GameManager(props) {
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);

  function handleAllPlayersReady() {
    alert('Players Ready');
    setWaitingForPlayers(false);
  }

  function handleGameConfig(data) {
    console.log('config received')
    console.log(data)
  }

  useEffect(() => {
    console.log('use effect')
    socketGame.joinGameRoom();

    socketGame.socket.on('all players ready', handleAllPlayersReady);
    socketGame.socket.on('game config', data => handleGameConfig(data));
  }, [])


  return (
    <div>
      <h2>Game Manager {socketGame.gameCode}</h2>
      <PongInterface waitingForPlayers={waitingForPlayers}/>
    </div>

  )
}

export default GameManager;