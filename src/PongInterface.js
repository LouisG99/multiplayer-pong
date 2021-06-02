import React, { useState, useEffect } from 'react';
import { Stage, Layer, Arc } from 'react-konva';

import {
  getDotProduct,
  getAngleFromCoords,
  getVectorTangentToCircle,
  getDistance,
  getCircleParams,
  getRelativeWidth, 
  getRelativeHeight,
} from './utility';

import { BackgroundRect, Ball, PlayerArc } from './GameObjects';
import { socketGame } from './SocketWrapper';


class BallState {
  constructor(gameConfig) {
    this.position = gameConfig.startBall;
    this.speed = gameConfig.initBallSpeed;
    this.size = gameConfig.ballSize;
  }
}

class Players {
  constructor(gameConfig, borderLimitsIn) {
    let ratioBoundaryPlayer = gameConfig.ratioBoundaryPlayer;
    this.speed = gameConfig.playerSpeed;
    this.numPlayers = gameConfig.numPlayers;
    this.borderLimits = borderLimitsIn;
    this.playerIndex = gameConfig.playerIndex; // index of client

    this.angles = []; // [anglePlayer1]
    this.mvnts = []; // 1, -1, or 0 for all players

    this.boundaryAngle = 360. / this.numPlayers; // degrees, make sure as + player come, size of player arc decreases
    this.playerAngle = this.boundaryAngle * ratioBoundaryPlayer;

    for (let i = 0; i < this.numPlayers; ++i) {
      let startAngle = (this.getMinAngleFromIndex(i) + this.getMaxAngleFromIndex(i) - this.playerAngle) / 2;
      this.angles.push(startAngle);
      this.mvnts.push(0);
    }

    this.getMinAngleFromIndex = this.getMinAngleFromIndex.bind(this);
    this.getMaxAngleFromIndex = this.getMaxAngleFromIndex.bind(this);
    this.getXFromIndex = this.getXFromIndex.bind(this);
  }

  getXFromIndex(playerIndex) {
    playerIndex = playerIndex % this.numPlayers; // so we can do +1
    let playerAngle = this.angles[playerIndex];
    let [xCenter, _, radius] = getCircleParams(this.borderLimits);

    return xCenter + radius * Math.cos(playerAngle);
  }

  getYFromIndex(playerIndex) {
    playerIndex = playerIndex % this.numPlayers; // so we can do +1
    let playerAngle = this.angles[playerIndex];
    let [_, yCenter, radius] = getCircleParams(this.borderLimits);

    return yCenter + radius * Math.sin(playerAngle);
  }

  getMinAngleFromIndex(playerIndex) {
    return this.boundaryAngle * playerIndex;
  }

  getMaxAngleFromIndex(playerIndex) {
    return this.getMinAngleFromIndex(playerIndex + 1);
  }
}


function getUpdatedBallCoords(prev_position, speed, curr_ts, last_ts) {
  let x = prev_position[0] + speed[0] * (curr_ts - last_ts); // diff is in ms
  let y = prev_position[1] + speed[1] * (curr_ts - last_ts);
  return [x, y];
}


function GameEngine(props) {
  const timeoutPeriodBall = 10; // ms
  const timeoutPeriodPlayer = 20; // ms

  const [ballObj, setBallObj] = useState(new BallState(props.gameConfig));
  const [players, setPlayers] = useState(new Players(props.gameConfig, props.borderLimits));
  const [gameOn, setGameOn] = useState(false);
  const [lastBallTs, setLastBallTs] = useState(null);


  // returns index of which player "owns" section of "disk" the ball is in
  function getBallPlayerArea(x, y) {
    let [xCenter, yCenter, _] = getCircleParams(props.borderLimits);
    let angle = getAngleFromCoords(x, y, xCenter, yCenter);

    return Math.floor(angle / players.boundaryAngle);
  }

  function getSpeedBoundaryNormalAngle(x, y, playerIndex) {
    let [xCenter, yCenter, _] = getCircleParams(props.borderLimits);
    let distCenter = getDistance(x, y, xCenter, yCenter); // ball might not be exactly at dist=radius from center
    let tangentVector = getVectorTangentToCircle(x, xCenter, distCenter);
    console.log("tangent Vector:", tangentVector)

    let dotProduct = getDotProduct(tangentVector, ballObj.speed);
    let sizeSpeedVec = Math.sqrt(Math.pow(ballObj.speed[0], 2) + Math.pow(ballObj.speed[1], 2));
    let sizeBoundaryVec = Math.sqrt(Math.pow(tangentVector[0], 2) + Math.pow(tangentVector[1], 2));
    let cosAngle = dotProduct / (sizeSpeedVec * sizeBoundaryVec);

    return Math.acos(cosAngle);
  }

  // return [whetherBoundaryIsHit, ifPointWasScore/Lost, whichPlayerArea]
  function checkPlayerThere(x, y) {
    x = getRelativeWidth(x);
    y = getRelativeHeight(y);

    let playerIndex = getBallPlayerArea(x, y);
    let [xCenter, yCenter, radius] = getCircleParams(props.borderLimits);
    let ballDistanceCenter = getDistance(x, y, xCenter, yCenter);
    let boundaryHit = false, pointScored = false;

    if (ballDistanceCenter >= radius) {
      boundaryHit = true;
      let ballAngle = getAngleFromCoords(x, y, xCenter, yCenter);
      let playerAngle = players.angles[playerIndex];

      if (ballAngle < playerAngle || ballAngle > (playerAngle + players.playerAngle)) {
        pointScored = true;
      }
    }

    return [boundaryHit, pointScored, playerIndex];
  }

  function getReboundSpeed(x, y, playerIndex) {
    let normalAngle = getSpeedBoundaryNormalAngle(x, y, playerIndex);
    let normalVec = [Math.cos(normalAngle), Math.sin(normalAngle)];
    console.log("normal Angle:", normalAngle);
    console.log("normal vec:", normalVec);
    let prevSpeed = ballObj.speed;
    let ratioPerpPart = getDotProduct(prevSpeed, normalVec) / getDotProduct(normalVec, normalVec);
    let perpendicularPart = [normalVec[0] * ratioPerpPart, normalVec[1] * ratioPerpPart];
    let parallelPart = [prevSpeed[0] - perpendicularPart[0], prevSpeed[1] - perpendicularPart[1]];

    console.log("per part", perpendicularPart);
    console.log("para part", parallelPart)

    return [parallelPart[0] - perpendicularPart[0], parallelPart[1] - perpendicularPart[1]];;
  }

  function handleEndPoint(clientBoundary) {
    if (clientBoundary) {
      socketGame.updatePlayerLostPoint();
    }
    setGameOn(false);
  }

  function updateSpeed(x, y) {
    const [boundaryHit, pointScored, playerIndex] = checkPlayerThere(x, y);
    let clientBoundary = playerIndex === props.gameConfig.playerIndex;

    if (!boundaryHit) {
      return ballObj.speed;
    }
    else if (boundaryHit && !pointScored) {
      let newSpeed = getReboundSpeed(x, y, playerIndex);
      if (clientBoundary) {
        socketGame.updatePlayerRebound([x, y], newSpeed);
      }
      return newSpeed;
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
      let newSpeed = updateSpeed(x + ballObj.size / 2, y + ballObj.size / 2); // use center of ball as ref
      setBallObj(Object.assign({}, ballObj, { 
        position: [x, y], 
        speed: newSpeed
      }));
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
    let curr_angle = players.angles[players.playerIndex];

    socketGame.updatePlayerMove(players.playerIndex, curr_angle, newMvnt);
    setPlayers(Object.assign({}, players, { 
      mvnts: modifIndexOfArr(players.mvnts, players.playerIndex, newMvnt) 
    }));
  }

  function handleKeyUp(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      let curr_angle = players.angles[players.playerIndex];
      socketGame.updatePlayerMove(players.playerIndex, curr_angle, 0);
      
      setPlayers(Object.assign({}, players, { 
        mvnts: modifIndexOfArr(players.mvnts, players.playerIndex, 0) 
      }));
    }
  }

  function helperPlayerMoves(playerIndex, ms_elapsed) {
    let nextAngle = players.angles[playerIndex] + players.mvnts[playerIndex] * players.speed * ms_elapsed;
    let minAngle = players.getMinAngleFromIndex(playerIndex);
    let maxAngle = players.getMaxAngleFromIndex(playerIndex) - players.playerAngle;

    return Math.max(minAngle, Math.min(maxAngle, nextAngle));
  }

  function userKeyMovesLoopClosure() {
    let last_ts = Date.now();

    function userKeyMovesLoop() {
      let curr_ts = Date.now();
      let p_cp = Object.assign({}, players);
      let modified = false;

      for (let i = 0; i < p_cp.numPlayers; ++i) {
        if (p_cp.mvnts[i] !== 0) {
          let prev = p_cp.angles[i];
          p_cp.angles[i] = helperPlayerMoves(i, curr_ts - last_ts);
          modified |= JSON.stringify(p_cp.angles[i]) !== JSON.stringify(prev);
        }
      }

      if (modified) {
        setPlayers(Object.assign({}, players, { angles: p_cp.angles }));
      }
      last_ts = curr_ts;
    }

    return userKeyMovesLoop;
  }


  useEffect(() => {
    /* This event listener sets ballObj but doesn't read its value so ne need to make it
       dependent on it */
    socketGame.socket.on('game on', handleGameOn);
  }, []);


  useEffect(() => { // Loop for player movements
    /* These eventListeners need to read players as they access the currentMvnt */
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    socketGame.socket.on('player move', handleOtherPlayerUpdate);
    socketGame.socket.on('player rebound', handlePlayerRebound);

    let userKeyMovesLoop = userKeyMovesLoopClosure();
    let interval = setInterval(() => userKeyMovesLoop(), timeoutPeriodPlayer);

    return (() => {
      clearInterval(interval);

      // necessary to remove listeners so they're not attached more than once at next call
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      socketGame.socket.off('player move', handleOtherPlayerUpdate);
      socketGame.socket.off('player rebound', handlePlayerRebound);
    });
  }, [players]);


  useEffect(() => setLastBallTs(gameOn ? Date.now() : null), [gameOn])

  useEffect(() => { // Loop for ball movement
    if (gameOn) {
      let timeout = setTimeout(moveBall, timeoutPeriodBall);
      return (() => clearTimeout(timeout));
    }
  }, [ballObj, players, gameOn, lastBallTs])

  

  function handleOtherPlayerUpdate(update) {
    let newAngles = modifIndexOfArr(players.angles, update.playerIndex, update.newAngle);
    let newMvnts = modifIndexOfArr(players.mvnts, update.playerIndex, update.mvnt);
    setPlayers(Object.assign({}, players, { 
      angles: newAngles, mvnts: newMvnts
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

  let playerArcs = [];
  let [xCenter, yCenter, innerRadius] = getCircleParams(props.borderLimits);

  for (var i = 0; i < props.gameConfig.numPlayers; i++) {
    let boundaryRotation = players.getMinAngleFromIndex(i);

    playerArcs.push(
      <PlayerArc
        isLocalPlayer={props.gameConfig.playerIndex === i}
        x={xCenter}
        y={yCenter}
        innerRadius={innerRadius}
        playerRotation={players.angles[i]}
        boundaryRotation={boundaryRotation}
        playerAngle={players.playerAngle}
        boundaryAngle={players.boundaryAngle}
      />
    );
  }

  // console.log(ballObj.position)
  
  return (
    <Layer>      
      {playerArcs}

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

  // let limits = generatePlayerLimits(borderLimits, 8);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Background Layer */}
      <Layer> 
        <BackgroundRect width={rectDims[0]} height={rectDims[1]}/>
      </Layer>

      {/* Players + Ball Layer */}
      <GameEngine 
        borderLimits={borderLimits} 
        gameConfig={props.gameConfig}
        />
    </Stage>
  );
}


export default PongInterface;