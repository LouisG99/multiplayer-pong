import React, { Component, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';

import { 
  isWithinXBoundaries, 
  isWithinYBoundaries, 
  getCircleParams,
  getAngleIncrement,
  projectPointOnLine,
  generatePlayerLimits, 
  getRelativeWidth, 
  getRelativeHeight,
} from './utility';

import { BackgroundRect, Ball, PlayerStick, PlayerStick2 } from './GameObjects';
import { socketGame } from './SocketWrapper';


class BallState {
  constructor(gameConfig) {
    this.position = gameConfig.startBall;
    this.speed = gameConfig.initBallSpeed;
    this.size = gameConfig.ballSize;
  }
}

class Players {
  // TODO: change length and speed of player depending on area they have to cover 
  // (the + the # of player, the smaller these should become)
  constructor(gameConfig, borderLimitsIn) {
    this.length = gameConfig.lengthPlayer;
    this.speed = gameConfig.playerSpeed;
    this.numPlayers = gameConfig.numPlayers;
    this.borderLimits = borderLimitsIn;
    this.playerIndex = gameConfig.playerIndex; // index of client

    this.positions = []; // [[xstart_player1, ystart_player1, xend_player1, yend_player1]]
    this.XYspeeds = []; // [{'x': xspeed_player1, 'y': yspeed_player1}]
    this.mvnts = []; // 1, -1, or 0 for all players
    this.surfaceToCoverLimits = []; // [[startx, starty, endx, endy]]
    this.stickLimits = []; // [{'start': {'minX':, 'minY':, 'maxX':, 'maxY': }, 'end': {...}}]x

    for (let i = 0; i < this.numPlayers; ++i) {
      let x = this.getXFromIndex(i), y = this.getYFromIndex(i);
      let [endX, endY] = this.getEndXYFromIndex(i, x, y);
      this.positions.push([x, y, endX, endY]);
      this.XYspeeds.push(this.getXYSpeedsFromIndex(endX - x, endY - y));
      this.mvnts.push(0);
      this.surfaceToCoverLimits.push([x, y, this.getXFromIndex(i+1), this.getYFromIndex(i+1)]);
      this.stickLimits.push(this.getStickLimitsFromIndex(i));
    }
  }

  getXFromIndex(playerIndex) {
    playerIndex = playerIndex % this.numPlayers; // so we can do +1
    let [xCenter, _, radius] = getCircleParams(this.borderLimits);

    return xCenter + radius * Math.cos(getAngleIncrement(this.numPlayers) * playerIndex);
  }

  getYFromIndex(playerIndex) {
    playerIndex = playerIndex % this.numPlayers; // so we can do +1
    let [_, yCenter, radius] = getCircleParams(this.borderLimits);

    return yCenter + radius * Math.sin(getAngleIncrement(this.numPlayers) * playerIndex);
  }

  getEndXYFromIndex(playerIndex, x, y) {
    if (this.numPlayers === 2) {
      return [x, y + getRelativeHeight(this.length)];
    }
    let nextX = this.getXFromIndex(playerIndex + 1);
    let nextY = this.getYFromIndex(playerIndex + 1);
    let diffX = nextX - x;
    let diffY = nextY - y;
    let ratio = getRelativeHeight(this.length) / (Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2)));

    return[x + ratio * diffX, y + ratio * diffY];
  }

  getXYSpeedsFromIndex(diffX, diffY) {
    if (this.numPlayers === 2) {
      return {'x': 0, 'y': this.speed};
    }

    return {
      'x': diffX / getRelativeHeight(this.length) * this.speed, 
      'y': diffY / getRelativeHeight(this.length) * this.speed
    };
  }

  getStickLimitsFromIndex(i) {
    let x = this.positions[i][0], y = this.positions[i][1];
    let diffX = this.positions[i][2] - x;
    let diffY = this.positions[i][3] - y; 
    let nextX = this.getXFromIndex(i+1), nextY = this.getYFromIndex(i+1);

    return {
      'start': {
        'minX': Math.min(x, nextX - diffX),
        'minY': Math.min(y, nextY - diffY),
        'maxX': Math.max(x, nextX - diffX),
        'maxY': Math.max(y, nextY - diffY)
      }, 
      'end': {
        'minX': Math.min(x + diffX, this.getXFromIndex(i+1)),
        'minY': Math.min(y + diffY, this.getYFromIndex(i+1)),
        'maxX': Math.max(x + diffX, this.getXFromIndex(i+1)),
        'maxY': Math.max(y + diffY, this.getYFromIndex(i+1))
      }
    };
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
  // [playerIndex, angle (between 0 and 2*Pi)]
  function getBallPlayerArea(x, topY) {
    let [xCenter, yCenter, _] = getCircleParams(props.borderLimits);
    let xDiff = x - xCenter, yDiff = topY - yCenter;
    let angle = Math.atan(yDiff / xDiff); // returns value between -pi/2 and pi/2
    if (angle > 0 && xDiff < 0 && yDiff < 0) {
      angle += Math.PI;
    } else if (angle < 0 && xDiff < 0 && yDiff > 0) {
      angle += Math.PI;
    }

    if (angle < 0) {
      angle += 2 * Math.PI;
    }

    return [Math.floor(angle / getAngleIncrement(props.gameConfig.numPlayers)), angle];
  }

  // {'x': , 'y': }
  function projectBallOnBoundary(x, topY, playerIndex) {
    let playerLimits = players.surfaceToCoverLimits[playerIndex];
    let boundaryYSlope = (playerLimits[3] - playerLimits[1]) / (playerLimits[2] - playerLimits[0]);
    let boundaryYInt = playerLimits[1] - boundaryYSlope * playerLimits[0];
    console.log(playerLimits, boundaryYSlope, boundaryYInt);
    return projectPointOnLine(x, topY, boundaryYSlope, boundaryYInt);
  }

  /**
   * returns [bool1, bool2]
   * bool1: where a player is there
   * bool2: whether the boundary is that of the client
   */ 
  // TODO: fix with more players now
  function checkPlayerThere(x, topY) {
    x = getRelativeWidth(x);
    topY = getRelativeWidth(topY);
    // let bottomY = topY + ballObj.size;

    let [playerIndex, angle] = getBallPlayerArea(x, topY);
    let [xCenter, yCenter, _] = getCircleParams(props.borderLimits);
    let projectPoint = projectBallOnBoundary(x, topY, playerIndex);

    let projectPointDistanceCenter = Math.sqrt(
      Math.pow(projectPoint['x'] - xCenter, 2) + Math.pow(projectPoint['y'] - yCenter, 2)
    );
    let ballDistanceCenter = Math.sqrt(
      Math.pow(x - xCenter, 2) + Math.pow(topY - yCenter, 2)
    );

    let boundaryHit = false, pointScored = false;
    console.log(x, topY, projectPoint, players.positions[playerIndex], ballDistanceCenter, projectPointDistanceCenter);

    if (ballDistanceCenter >= projectPointDistanceCenter) {
      boundaryHit = true;
      let positions = players.positions[playerIndex];

      if (positions[0] == positions[2]) {
        let minYPos = Math.min(positions[1], positions[3]);
        let maxYPos = Math.max(positions[1], positions[3]);
        pointScored = projectPoint['y'] < minYPos || projectPoint['y'] > maxYPos;
      } else {
        let minXPos = Math.min(positions[0], positions[2]);
        let maxXPos = Math.max(positions[0], positions[2]);
        pointScored = projectPoint['x'] < minXPos || projectPoint['x'] > maxXPos;
      }
    }

    return [boundaryHit, pointScored, playerIndex === props.gameConfig.playerIndex]

    // let player = (x < props.borderLimits[0]) ? 0 : 1;

    // let playerTop = players.positions[player];
    // let playerThere = (bottomY >= playerTop && topY <= playerTop + players.length);
    // return [playerThere, player === players.playerIndex];
  }

  function getReboundXSpeed() {
    // TODO
    return [-ballObj.speed[0], -ballObj.speed[1]];
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
    // console.log(players, players.surfaceToCoverLimits);
    // if (typeof players.surfaceToCoverLimits === 'undefined') return [0, 0];
    // let inXBounds = isWithinXBoundaries(x, y, props.borderLimits, ballObj.size, ballObj.speed);
    // let inYBounds = isWithinYBoundaries(x, y, props.borderLimits, ballObj.size, ballObj.speed);

    // if (inXBounds && inYBounds) return ballObj.speed;

    const [boundaryHit, pointScored, clientBoundary] = checkPlayerThere(x, y);
    console.log(boundaryHit, pointScored, clientBoundary);
    if (!boundaryHit) {
      return ballObj.speed;
    } else if (boundaryHit && !pointScored) {
      let newSpeed = getReboundXSpeed();
      if (clientBoundary) socketGame.updatePlayerRebound([x, y], newSpeed);
      return newSpeed;
    } else {
      handleEndPoint(clientBoundary);
      return [0, 0];
    }
    // if (!inXBounds && playerIsThere) { // player rebound
    //   let newSpeed = getReboundXSpeed();
    //   if (clientBoundary) socketGame.updatePlayerRebound([x, y], newSpeed);
    //   return newSpeed;
    // }
    // else if (inXBounds && !inYBounds) {
    //   return getReboundYSpeed();
    // }
    // else {
    //   handleEndPoint(clientBoundary);
    //   return [0, 0];
    // }
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

  function getNextPosition(oldPosition, mvnt, speed, ms_elapsed, minLimit, maxLimit) {
    let nextPosition = oldPosition + mvnt * speed * ms_elapsed;
    return Math.min(maxLimit, Math.max(minLimit, nextPosition));
  }

  function helperPlayerMoves(index, ms_elapsed) {
    let oldPosition = players.positions[index];
    let XYspeed = players.XYspeeds[index];
    let limits = players.stickLimits[index];
    let mvnt = players.mvnts[index];

    return [
      getNextPosition(oldPosition[0], mvnt, XYspeed['x'], ms_elapsed, limits['start']['minX'], limits['start']['maxX']),
      getNextPosition(oldPosition[1], mvnt, XYspeed['y'], ms_elapsed, limits['start']['minY'], limits['start']['maxY']),
      getNextPosition(oldPosition[2], mvnt, XYspeed['x'], ms_elapsed, limits['end']['minX'], limits['end']['maxX']),
      getNextPosition(oldPosition[3], mvnt, XYspeed['y'], ms_elapsed, limits['end']['minY'], limits['end']['maxY'])
    ];
  }

  function userKeyMovesLoopClosure() {
    let last_ts = Date.now();

    function userKeyMovesLoop() {
      let curr_ts = Date.now();
      let p_cp = Object.assign({}, players);
      let modified = false;

      for (let i = 0; i < p_cp.numPlayers; ++i) {
        if (p_cp.mvnts[i] !== 0) {
          let prev = p_cp.positions[i];
          p_cp.positions[i] = helperPlayerMoves(i, curr_ts - last_ts);
          modified |= JSON.stringify(p_cp.positions[i]) !== JSON.stringify(prev);
        }
      }

      if (modified) {
        setPlayers(Object.assign({}, players, { mvnts: p_cp.mvnts }));
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
    let newPosition = modifIndexOfArr(players.positions, update.playerIndex, update.newPosition);
    let newMvnts = modifIndexOfArr(players.mvnts, update.playerIndex, update.mvnt);
    setPlayers(Object.assign({}, players, { 
      positions: newPosition, mvnts: newMvnts
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

  let playerSticks = [];
  for (var i = 0; i < props.gameConfig.numPlayers; i++) {
    playerSticks.push(
      <PlayerStick
        points={players.positions[i]} 
        isLocalPlayer={props.gameConfig.playerIndex === i}
        surfaceToCoverLimits={players.surfaceToCoverLimits[i]}
      />
    );
  }
  
  return (
    <Layer>      
      {playerSticks}

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
  // let maplimits = limits.map((lim, index) => {
  //   return <PlayerStick2 limits={lim}/>
  // });

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

        {/* <Layer>{maplimits}</Layer> */}
    </Stage>
  );
}


export default PongInterface;