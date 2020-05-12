import React, { Component, useState, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Line } from 'react-konva';

import { widthOpposite, heightOpposite, isWithinXBoundaries, isWithinYBoundaries } from './utility';
import PlayerStick from './PlayerStick';
import { socketGame } from './SocketWrapper';


function BackgroundRect(props) {
  let backgroundColor = "#94C9F0";
  return <Rect x={0} y={0} width={window.innerWidth} height={window.innerHeight} 
          fill={backgroundColor} />
}

class Ball extends Component {
  /* x, y define where top left of object is */
  constructor(props) {
    super(props);

    this.state = {
      backgroundColor: "#ffffff"
    };
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.position !== this.props.position;
  }

  render() {
    return (
      <Rect x={this.props.position[0]} y={this.props.position[1]}
        width={this.props.size} height={this.props.size} 
        fill={this.state.backgroundColor}
      />
    )
  }
}

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

  reboundBallXSide() {
    this.speed = [-this.speed[0], this.speed[1]];
  }
  reboundBallYSide() {
    this.speed = [this.speed[0], -this.speed[1]];
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

  checkPlayerThere(x, topY, ballObj, limitXLeft) {
    let bottomY = topY + ballObj.size;
    let playerTop = (x < limitXLeft) ? this.positions[0] : this.positions[1];

    return (bottomY >= playerTop && topY <= playerTop + this.length);
  }
}


function GameManager(props) {
  const timeoutPeriodBall = 10; // ms
  const timeoutPeriodPlayer = 20; // ms

  const [ballObj, setBallObj] = useState(new BallState(props.gameConfig));
  const [players, setPlayers] = useState(new Players(props.gameConfig, 2, props.borderLimits));
  const [gameOn, setGameOn] = useState(true);
  const [ballMvmtTimer, setBallMvmtTimer] = useState(null);


  function checkPlayerThere(x, topY) {
    let bottomY = topY + ballObj.size;
    let limitXLeft = props.borderLimits[0];

    let playerTop = (x < limitXLeft) ? players.positions[0] : players.positions[1];

    return (bottomY >= playerTop && topY <= playerTop + players.length);
  }

  function reboundBallXSide() {
    setBallObj(oldBall => Object.assign({}, ballObj, { 
      speed: [-oldBall.speed[0], oldBall.speed[1]]
    }));
  }

  function handleBoundaries(x, y) {
    let inXBounds = isWithinXBoundaries(x, y, props.borderLimits, ballObj.size);
    let inYBounds = isWithinYBoundaries(x, y, props.borderLimits, ballObj.size);
    if (inXBounds && inYBounds) return;

    // if (!inXBounds && players.checkPlayerThere(x, y, ballObj, props.borderLimits[0])) {
    if (!inXBounds && checkPlayerThere(x, y)) {
      // ballObj.reboundBallXSide();
      reboundBallXSide();
    }
    else if (inXBounds && !inYBounds) {
      ballObj.reboundBallYSide();
    }
    // else if (ballMvmtTimer) {
    //   clearInterval(ballMvmtTimer)
    // }
  }

  function moveBall() {
    console.log(ballObj)
    let newX = ballObj.position[0] + ballObj.speed[0] * timeoutPeriodBall;
    let newY = ballObj.position[1] + ballObj.speed[1] * timeoutPeriodBall;

    handleBoundaries(newX, newY);
    setBallObj(Object.assign({}, ballObj, { position: [newX, newY] }));
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
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }, []);


  useEffect(() => { // Loop for player movements
    let interval = setInterval(userKeyMovesLoop, timeoutPeriodPlayer);
    return (() => clearInterval(interval));
  }, [players]);

  useEffect(() => { // Loop for ball movement
    let interval = setInterval(moveBall, timeoutPeriodBall);
    return (() => clearInterval(interval));
  }, [ballObj])

  // function runPlay() {
  //   let ballMvmtTimer = setInterval(() => {
  //     moveBall(); // move to ball
  //   }, 
  //   timeoutPeriod);
  //   setBallMvmtTimer(ballMvmtTimer);
  // }


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
    let leftXLimit = 50, topYLimit = 0;
    let borderLimits = [
      leftXLimit, topYLimit, leftXLimit, heightOpposite(topYLimit),
      widthOpposite(leftXLimit), topYLimit, widthOpposite(leftXLimit), heightOpposite(topYLimit)
    ]; // topLeft, bottomLeft, topRight, bottomRight
    return borderLimits;
  }

  const [borderLimits, setBorderLimits] = useState(getInitBorderLimits());
  
  if (props.waitingForPlayers) return <h2>Waiting for players</h2>;

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Background Layer */}
      <Layer> 
        <BackgroundRect/>
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