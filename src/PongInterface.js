import React, { Component, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';

import { isWithinXBoundaries, isWithinYBoundaries } from './utility';
import { BackgroundRect, Ball, PlayerStick } from './GameObjects';
import { socketGame } from './SocketWrapper';



class BallState {
  constructor(gameConfig) {
    this.position = gameConfig.startBall;
    this.speed = gameConfig.initBallSpeed;
    this.size = gameConfig.ballSize;
  }
}

class Players {
  constructor(gameConfig, numPlayersIn, borderLimitsIn) {
    this.length = gameConfig.lengthPlayer;
    this.speed = gameConfig.playerSpeed;
    this.numPlayers = numPlayersIn;
    this.borderLimits = borderLimitsIn;
    this.clientMvnt = 0;
    this.playerIndex = gameConfig.playerIndex; // index of client

    this.positions = [];
    for (let i = 0; i < this.numPlayers; ++i) {
      this.positions.push(borderLimitsIn[1]);
    }
  }
}


function GameManager(props) {
  const timeoutPeriodBall = 10; // ms
  const timeoutPeriodPlayer = 20; // ms

  const [ballObj, setBallObj] = useState(new BallState(props.gameConfig));
  const [players, setPlayers] = useState(new Players(props.gameConfig, 2, props.borderLimits));
  const [gameOn, setGameOn] = useState(false);


  /**
   * returns [bool1, bool2]
   * bool1: where a player is there
   * bool2: whether the boundary is that of the client
   */ 
  function checkPlayerThere(x, topY) {
    let bottomY = topY + ballObj.size;
    let player = (x < props.borderLimits[0]) ? 0 : 1;

    let playerTop = players.positions[player];
    let playerThere = (bottomY >= playerTop && topY <= playerTop + players.length);
    return [playerThere, player === players.playerIndex];
  }

  function getReboundXSpeed() {
    return [-ballObj.speed[0], ballObj.speed[1]];
  }
  function getReboundYSpeed() {
    return [ballObj.speed[0], -ballObj.speed[1]]
  }

  function handleEndPoint(clientBoundary) {
    if (clientBoundary) {
      socketGame.updatePlayerLostPoint();
    }
    setGameOn(false);
  }

  function updateSpeed(x, y) {
    let inXBounds = isWithinXBoundaries(x, y, props.borderLimits, ballObj.size);
    let inYBounds = isWithinYBoundaries(x, y, props.borderLimits, ballObj.size);

    if (inXBounds && inYBounds) return ballObj.speed;

    const [playerIsThere, clientBoundary] = checkPlayerThere(x, y);
    if (!inXBounds && playerIsThere) { // player rebound
      let newSpeed = getReboundXSpeed();
      if (clientBoundary) socketGame.updatePlayerRebound([x, y], newSpeed);
      return newSpeed;
    }
    else if (inXBounds && !inYBounds) {
      return getReboundYSpeed();
    }
    else {
      handleEndPoint(clientBoundary);
      return [0, 0];
    }
  }

  function moveBall() {
    let x = ballObj.position[0] + ballObj.speed[0] * timeoutPeriodBall;
    let y = ballObj.position[1] + ballObj.speed[1] * timeoutPeriodBall;
    setBallObj(Object.assign({}, ballObj, { position: [x, y], speed: updateSpeed(x, y) }));
  }

  function handleKeyDown(e) {
    if (e.keyCode === 38) setPlayers(Object.assign({}, players, { clientMvnt: -1 }));
    else if (e.keyCode === 40) setPlayers(Object.assign({}, players, { clientMvnt: 1 }));
  }

  function handleKeyUp(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      setPlayers(Object.assign({}, players, { clientMvnt: 0 }));
    }
  }

  function userKeyMovesLoop() {
    if (players.clientMvnt === 0) return;

    let newY = players.positions[players.playerIndex] + players.clientMvnt * players.speed;
    if (players.clientMvnt === -1) { // up
      newY = Math.max(newY, players.borderLimits[1]);
    }
    else if (players.clientMvnt === 1) { // down
      newY = Math.min(newY, players.borderLimits[3] - players.length);
    }

    let newPositions = players.positions;
    newPositions[players.playerIndex] = newY;
    setPlayers(Object.assign({}, players, { positions: newPositions }));
    socketGame.updatePlayerMove(players.playerIndex, newY);
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    socketGame.socket.on('player move', data => handleOtherPlayerUpdate(data));
    socketGame.socket.on('player rebound', data => handlePlayerRebound(data));
    socketGame.socket.on('game on', handleGameOn);
  }, []);


  useEffect(() => { // Loop for player movements
    let interval = setInterval(userKeyMovesLoop, timeoutPeriodPlayer);
    return (() => clearInterval(interval));
  }, [players]);

  useEffect(() => { // Loop for ball movement
    if (gameOn) {
      let interval = setInterval(moveBall, timeoutPeriodBall);
      return (() => clearInterval(interval));
    }
  }, [ballObj, players, gameOn])
  

  function handleOtherPlayerUpdate(update) {
    let newPositions = players.positions;
    newPositions[update.playerIndex] = update.newY;
    setPlayers(Object.assign({}, players, { positions: newPositions }));
  }

  function handlePlayerRebound(update) {
    setBallObj(Object.assign({}, ballObj, {
      speed: update.newBallSpeed, position: update.newBallPosition
    }));
  }

  function handleGameOn() {
    setBallObj(Object.assign({}, ballObj, {
      position: props.gameConfig.startBall, speed: props.gameConfig.initBallSpeed
    }));
    setGameOn(true);
  }


  return (
    <Layer>
      {/* Represent left and right players */}
      <PlayerStick 
        borderLimits={props.borderLimits}
        y={players.positions[0]} 
        leftPlayer={true} 
        lengthPlayer={players.length}
        />

      <PlayerStick 
        borderLimits={props.borderLimits}
        y={players.positions[1]} 
        leftPlayer={false} 
        lengthPlayer={players.length}
        />
      
      <Ball 
        borderLimits={props.borderLimits} 
        position={ballObj.position}
        size={ballObj.size} />
    </Layer>
  );
}


function PongInterface(props) {
  function getInitBorderLimits() {
    let leftXLimit = 0.05, topYLimit = 0;
    let borderLimits = [
      leftXLimit, topYLimit, leftXLimit, 1.0-topYLimit,
      1.0-leftXLimit, topYLimit, 1.0-leftXLimit, 1.0-topYLimit
    ]; // topLeft, bottomLeft, topRight, bottomRight

    return borderLimits;
  }

  const [borderLimits, setBorderLimits] = useState(getInitBorderLimits());
  const [rectDims, setRectDims] = useState([window.innerWidth, window.innerHeight])

  useEffect(() => {
    window.addEventListener('resize', () => setRectDims([window.innerWidth, window.innerHeight]) );
  }, [])
  

  if (props.waitingForPlayers) return <h2>Waiting for players</h2>;

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Background Layer */}
      <Layer> 
        <BackgroundRect width={rectDims[0]} height={rectDims[1]}/>
      </Layer>

      {/* Players + Ball Layer */}
      <GameManager 
        borderLimits={borderLimits} 
        gameConfig={props.gameConfig}
        />
    </Stage>
  );
}


export default PongInterface;