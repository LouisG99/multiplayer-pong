import React, { Component, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';

import { isWithinXBoundaries, isWithinYBoundaries } from './utility';
import { BackgroundRect, Ball, PlayerStick } from './GameObjects';
import { socketGame } from './SocketWrapper';


function sendSocketUpdatePlayerPos(playerIndex, newY) { // [x, y]
  socketGame.socket.emit('player move', 
    { playerIndex: playerIndex,  newY: newY });
}


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
  const [gameOn, setGameOn] = useState(true);


  function checkPlayerThere(x, topY) {
    let bottomY = topY + ballObj.size;
    let limitXLeft = props.borderLimits[0];

    let playerTop = (x < limitXLeft) ? players.positions[0] : players.positions[1];
    return (bottomY >= playerTop && topY <= playerTop + players.length);
  }

  function getReboundXSpeed() {
    return [-ballObj.speed[0], ballObj.speed[1]];
  }
  function getReboundYSpeed() {
    return [ballObj.speed[0], -ballObj.speed[1]]
  }


  function updateSpeed(x, y) {
    let inXBounds = isWithinXBoundaries(x, y, props.borderLimits, ballObj.size);
    let inYBounds = isWithinYBoundaries(x, y, props.borderLimits, ballObj.size);

    if (inXBounds && inYBounds) return ballObj.speed;

    if (!inXBounds && checkPlayerThere(x, y)) return getReboundXSpeed();
    else if (inXBounds && !inYBounds) return getReboundYSpeed();
    else return [0, 0];
  }

  function moveBall() {
    let x = ballObj.position[0] + ballObj.speed[0] * timeoutPeriodBall;
    let y = ballObj.position[1] + ballObj.speed[1] * timeoutPeriodBall;

    setBallObj(Object.assign({}, ballObj, { position: [x, y], speed: updateSpeed(x, y) }));
  }

  function handleKeyDown(e) {
    if (e.keyCode === 38) {
      setPlayers(Object.assign({}, players, { clientMvnt: -1 }));
    }
    else if (e.keyCode === 40) {
      setPlayers(Object.assign({}, players, { clientMvnt: 1 }));
    }
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
    setPlayers(Object.assign({}, players, { positions: newPositions }))
    // sendSocketUpdatePlayerPos(state.playerIndex, newY);
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // socketGame.socket.on('player move', data => this.handleOtherPlayerUpdate(data));
    // socketGame.socket.on('ball touched', data => this.handleBallTouched(data));
  }, []);


  useEffect(() => { // Loop for player movements
    let interval = setInterval(userKeyMovesLoop, timeoutPeriodPlayer);
    return (() => clearInterval(interval));
  }, [players]);

  useEffect(() => { // Loop for ball movement
    let interval = setInterval(moveBall, timeoutPeriodBall);
    return (() => clearInterval(interval));
  }, [ballObj, players])
  

  function handleOtherPlayerUpdate(update) {
    this.setState(state => {
      let newPlayersY = state.playersY;
      newPlayersY[update.playerIndex] = update.newY;
      return { playersY: newPlayersY };
    })
  }

  function handleBallTouched(update) {
    console.log('handle ball touched')
    // this.setState(state => {

    // })
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