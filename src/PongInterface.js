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
    this.playerIndex = gameConfig.playerIndex; // index of client

    this.positions = [];
    for (let i = 0; i < this.numPlayers; ++i)
      this.positions.push(borderLimitsIn[1]);

    this.mvnts = []; // 1, -1, or 0 for all players
    for (let i = 0; i < this.numPlayers; ++i)
      this.mvnts.push(0);
  }
}


function getUpdatedBallCoords(prev_position, speed, curr_ts, last_ts) {
  let x = prev_position[0] + speed[0] * (curr_ts - last_ts); // diff is in ms
  let y = prev_position[1] + speed[1] * (curr_ts - last_ts);
  return [x, y];
}


function GameManager(props) {
  const timeoutPeriodBall = 10; // ms
  const timeoutPeriodPlayer = 20; // ms

  const [ballObj, setBallObj] = useState(new BallState(props.gameConfig));
  const [players, setPlayers] = useState(new Players(props.gameConfig, 2, props.borderLimits));
  const [gameOn, setGameOn] = useState(false);
  const [lastBallTs, setLastBallTs] = useState(null);


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
    let inXBounds = isWithinXBoundaries(x, y, props.borderLimits, ballObj.size, ballObj.speed);
    let inYBounds = isWithinYBoundaries(x, y, props.borderLimits, ballObj.size, ballObj.speed);

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
    let curr_ts = Date.now();
    if (lastBallTs) {
      let [x, y] = getUpdatedBallCoords(ballObj.position, ballObj.speed, curr_ts, lastBallTs);
      setBallObj(Object.assign({}, ballObj, { position: [x, y], speed: updateSpeed(x, y) }));
    }
    setLastBallTs(curr_ts);
  }


  function modifIndexOfArr(arr, index, val) {
    let arr_copy = arr.slice(0);
    arr_copy[index] = val;
    return arr_copy;
  }

  function handleKeyDown(e) {
    if (e.keyCode !== 38 && e.keyCode !== 40) return;

    let currMvnt = players.mvnts[players.playerIndex];
    if (e.keyCode === 38 && currMvnt === -1) return;
    else if (e.keyCode === 40 && currMvnt === 1) return;

    let newMvnt = (e.keyCode === 38) ? -1 : 1;
    let curr_pos = players.positions[players.playerIndex];

    socketGame.updatePlayerMove(players.playerIndex, curr_pos, newMvnt);
    setPlayers(Object.assign({}, players, { 
      mvnts: modifIndexOfArr(players.mvnts, players.playerIndex, newMvnt) 
    }));
  }

  function handleKeyUp(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      let curr_pos = players.positions[players.playerIndex];
      socketGame.updatePlayerMove(players.playerIndex, curr_pos, 0);
      
      setPlayers(Object.assign({}, players, { 
        mvnts: modifIndexOfArr(players.mvnts, players.playerIndex, 0) 
      }));
    }
  }

  function helperPlayerMoves(index, ms_elapsed) {
    let newY = players.positions[index] + players.mvnts[index] * players.speed * ms_elapsed;
    if (players.mvnts[index] === -1) { // up
      newY = Math.max(newY, players.borderLimits[1]);
    }
    else if (players.mvnts[index] === 1) { // down
      newY = Math.min(newY, players.borderLimits[3] - players.length);
    }
    return newY;
  }

  function userKeyMovesLoopClosure() {
    let last_ts = Date.now();
    
    function userKeyMovesLoop() {
      let curr_ts = Date.now();
      let newPositions = players.positions; // this is problematic (will mutate state directly)
      let modified = false;
  
      for (let i = 0; i < players.numPlayers; ++i) {
        if (players.mvnts[i] !== 0) {
          let prev = newPositions[i];
          newPositions[i] = helperPlayerMoves(i, curr_ts - last_ts);
          if (newPositions[i] !== prev) modified = true;
        }
      }
  
      if (modified) {
        setPlayers(Object.assign({}, players, { positions: newPositions }));
      }    
      last_ts = curr_ts;
    }

    return userKeyMovesLoop;
  }


  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    socketGame.socket.on('player move', data => handleOtherPlayerUpdate(data));
    socketGame.socket.on('player rebound', data => handlePlayerRebound(data));
    socketGame.socket.on('game on', handleGameOn);
  }, []);


  useEffect(() => { // Loop for player movements
    let userKeyMovesLoop = userKeyMovesLoopClosure();
    let interval = setInterval(() => userKeyMovesLoop(), timeoutPeriodPlayer);
    return (() => clearInterval(interval));
  }, [players]);

  useEffect(() => {
    setLastBallTs(gameOn ? Date.now() : null);
  }, [gameOn])

  useEffect(() => { // Loop for ball movement
    if (gameOn) {
      let timeout = setTimeout(moveBall, timeoutPeriodBall);
      return (() => clearTimeout(timeout));
    }
  }, [ballObj, players, gameOn, lastBallTs])

  

  function handleOtherPlayerUpdate(update) {
    let newPositions = modifIndexOfArr(players.positions, update.playerIndex, update.newY);
    let newMvnts = modifIndexOfArr(players.mvnts, update.playerIndex, update.mvnt);
    setPlayers(Object.assign({}, players, { 
      positions: newPositions, mvnts: newMvnts
    }));
  }

  function handlePlayerRebound(update) {
    let rebound_pos = update.newBallPosition;
    let newSpeed = update.newBallSpeed;
    let newPosition = getUpdatedBallCoords(rebound_pos, newSpeed, Date.now(), update.ts);
    
    setBallObj(Object.assign({}, ballObj, {
      speed: newSpeed, position: newPosition
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