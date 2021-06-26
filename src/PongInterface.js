import React, { useState, useEffect } from 'react';
import { Stage, Layer, Arc } from 'react-konva';

import {
  getDotProduct,
  radToDegree,
  getAngleFromCoords,
  getDistance,
  getCircleParams,
  getRelativeWidth, 
  getRelativeHeight,
  getCoordsFromCenterRelative,
} from './utility';

import { BackgroundRect, Ball, PlayerArc } from './GameObjects';
import { socketGame } from './SocketWrapper';


class BallState {
  constructor(gameConfig) {
    /* Position of center ball, format [x, y] where x & y are numbers between -1 and 1,
       representing how far from the center is as ratio to radius */
    this.position = gameConfig.startBall;
    this.speed = gameConfig.initBallSpeed;
    this.size = gameConfig.ballSize;
    this.lastAngleRebound = Infinity;
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
  // no need for a ratio, position depends on the circle, works on any window size
  let x = prev_position[0] + speed[0] * (curr_ts - last_ts); // diff is in ms
  let y = prev_position[1] + speed[1] * (curr_ts - last_ts);
  return [x, y];
}

function GameEngine(props) {
  const timeoutPeriodBall = 20; // ms
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

  // return [whetherBoundaryIsHit, ifPointWasScore/Lost, whichPlayerArea]
  function checkPlayerThere(x, y, lastAngleRebound) {
    [x, y] = getCoordsFromCenterRelative([x, y], props.borderLimits);

    let playerIndex = getBallPlayerArea(x, y);
    let [xCenter, yCenter, radius] = getCircleParams(props.borderLimits);
    let ballDistanceCenter = getDistance(x, y, xCenter, yCenter);
    let boundaryHit = false, pointScored = false;

    let ballAngle = getAngleFromCoords(x, y, xCenter, yCenter);
    let angleDiffLastRebound = Math.abs(ballAngle - lastAngleRebound);
    let angleThreshold = 0.01 * 360;

    if (ballDistanceCenter >= radius && angleDiffLastRebound > angleThreshold) {
      boundaryHit = true;
      // console.log("REBOUND", lastAngleRebound, ballAngle, angleDiffLastRebound, radius)
      
      let playerAngle = players.angles[playerIndex];

      if (ballAngle < playerAngle || ballAngle > (playerAngle + players.playerAngle)) {
        pointScored = true;
      }
    }

    return [boundaryHit, pointScored, playerIndex];
  }

  function getReboundSpeed(x, y) {
    [x, y] = getCoordsFromCenterRelative([x, y], props.borderLimits);
    let [xCenter, yCenter, _] = getCircleParams(props.borderLimits);

    let normalVec = [xCenter - x, yCenter - y];
    let prevSpeed = ballObj.speed;
    let ratioPerpPart = getDotProduct(prevSpeed, normalVec) / getDotProduct(normalVec, normalVec);
    let perpendicularPart = [normalVec[0] * ratioPerpPart, normalVec[1] * ratioPerpPart];
    let parallelPart = [prevSpeed[0] - perpendicularPart[0], prevSpeed[1] - perpendicularPart[1]];

    // let parallelPart  = [normalVec[0] * ratioPerpPart, normalVec[1] * ratioPerpPart];
    // let perpendicularPart  = [prevSpeed[0] - parallelPart[0], prevSpeed[1] - parallelPart[1]];


    return [parallelPart[0] - perpendicularPart[0], parallelPart[1] - perpendicularPart[1]];;
  }

  function handleEndPoint(clientBoundary) {
    if (clientBoundary) {
      socketGame.updatePlayerLostPoint();
    }
    setGameOn(false);
  }

  function updateSpeed(x, y, lastAngleRebound) {
    const [boundaryHit, pointScored, playerIndex] = checkPlayerThere(x, y, lastAngleRebound);
    let clientBoundary = playerIndex === props.gameConfig.playerIndex;

    if (!boundaryHit) {
      return [ballObj.speed, lastAngleRebound];
    }
    else if (boundaryHit && !pointScored) {
      let newSpeed = getReboundSpeed(x, y);
      let angleRebound = getAngleFromCoords(x, y, 0, 0); // pos is relative to circle center

      if (clientBoundary) {
        socketGame.updatePlayerRebound(
          [x, y],
          newSpeed, 
          angleRebound
        );
      }
      return [newSpeed, angleRebound];
    } 
    else {
      handleEndPoint(clientBoundary);
      return [[0, 0], Infinity];
    }
  }

  
  function moveBall() {
    let curr_ts = Date.now();
    if (lastBallTs) {
      // getUpdatedBallCords returns value of x, y only between 0 and 1 --> need to scale to window width & height
      let [xPercent, yPercent] = getUpdatedBallCoords(ballObj.position, ballObj.speed, curr_ts, lastBallTs);
      let [newSpeed, angleRebound] = updateSpeed(
        xPercent, 
        yPercent,
        ballObj.lastAngleRebound
      );
      setBallObj(Object.assign({}, ballObj, { 
        position: [xPercent, yPercent], 
        speed: newSpeed,
        lastAngleRebound: angleRebound
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
    /* This event listener sets ballObj but doesn't read its value so no need to make it
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
  }, [players, ballObj]);


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
    let now = Date.now();
    let newPosition = getUpdatedBallCoords(rebound_pos, newSpeed, now, update.ts);
    
    setBallObj(Object.assign({}, ballObj, {
      speed: newSpeed, 
      position: newPosition,
      lastAngleRebound: update.angleRebound
    }));
    setLastBallTs(now);
  }

  function handleGameOn() {
    setBallObj(Object.assign({}, ballObj, {
      position: props.gameConfig.startBall, 
      speed: props.gameConfig.initBallSpeed
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

  // console.log("render", ballObj)
  
  return (
    <Layer>      
      {playerArcs}

      <Ball 
        borderLimits={props.borderLimits} 
        positionToCenter={ballObj.position}
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