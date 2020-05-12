import React, { Component } from 'react';
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


/* rewrite as functional component eventually */
class GameManager extends Component {
  static timeoutPeriod = 10; // ms

  constructor(props) {
    super(props);
    let gameConfig = props.gameConfig; // defined in gameconfig.py in backend

    this.state = {
      ballPosition: gameConfig.startBall, // [x, y]
      ballSpeed: gameConfig.initBallSpeed, // [speedx, speedy], in px/ms
      ballSize: gameConfig.ballSize, /* height & width */
      ongoingGame: true, 
      lengthPlayer: gameConfig.lengthPlayer,  // length of stick of player in px
      playersY: [props.borderLimits[1], props.borderLimits[1]], // only 2 players for normal case
      playerIndex: gameConfig.playerIndex, // player on this client
      playerSpeed: gameConfig.playerSpeed, // px move per keypress
      playerMvnt: 0 // 0->still, -11->up, 1->down
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.runPlay = this.runPlay.bind(this);
    this.handleBoundaries = this.handleBoundaries.bind(this);
    this.checkPlayerThere = this.checkPlayerThere.bind(this);
    this.reboundBallXSide = this.reboundBallXSide.bind(this);
    this.reboundBallYSide = this.reboundBallYSide.bind(this);
    this.moveBall = this.moveBall.bind(this);

    this.handleOtherPlayerUpdate = this.handleOtherPlayerUpdate.bind(this);
  }

  componentDidMount() {
    this.runPlay();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    socketGame.socket.on('player move', data => this.handleOtherPlayerUpdate(data));

    this.userKeyMovesLoop()
  }


  userKeyMovesLoop() {
    setInterval(() => {
      this.setState((state, props) => {
        if (state.playerMvnt === 0) return {};

        let newY = state.playersY[state.playerIndex] + state.playerMvnt * state.playerSpeed;
        if (state.playerMvnt === -1) { // up
          newY = Math.max(newY, props.borderLimits[1]);
        }
        else if (state.playerMvnt === 1) { // down
          newY = Math.min(newY, props.borderLimits[3] - state.lengthPlayer);
        }

        let newPlayersY = state.playersY;
        newPlayersY[state.playerIndex] = newY;
        sendSocketUpdatePlayerPos(state.playerIndex, newY);

        return { playersY : newPlayersY };
      })
    }, 20);
  }

  handleKeyDown(e) {
    this.setState(state => {
      if (e.keyCode === 38) return { playerMvnt: -1 };
      else if (e.keyCode === 40) return { playerMvnt: 1 };
    });
  }

  handleKeyUp(e) {
    this.setState({ playerMvnt: 0 });
  }

  handleOtherPlayerUpdate(update) {
    this.setState(state => {
      let newPlayersY = state.playersY;
      newPlayersY[update.playerIndex] = update.newY;
      return { playersY: newPlayersY };
    })
  }

  runPlay() {
    let ballMvmtTimer = setInterval(() => {
      this.moveBall();
    }, 
    GameManager.timeoutPeriod)

    this.ballMvmtTimer = ballMvmtTimer;
  }

  checkPlayerThere(x, topY) {
    let bottomY = topY + this.state.ballSize;
    let limitXLeft = this.props.borderLimits[0];

    let state = this.state;
    let playerTop = (x < limitXLeft) ? state.playersY[0] : state.playersY[1];

    return (bottomY >= playerTop && topY <= playerTop + state.lengthPlayer);
  }

  reboundBallXSide() {
    this.setState((state, props) => {
      return { ballSpeed: [-state.ballSpeed[0], state.ballSpeed[1]] } 
    });
  }

  reboundBallYSide() {
    this.setState((state, props) => {
      return { ballSpeed: [state.ballSpeed[0], -state.ballSpeed[1]] }
    });
  }

  handleBoundaries(x, y) {
    let inXBounds = isWithinXBoundaries(x, y, this.props.borderLimits, this.state.ballSize);
    let inYBounds = isWithinYBoundaries(x, y, this.props.borderLimits, this.state.ballSize);
    if (inXBounds && inYBounds) return;

    if (!inXBounds && this.checkPlayerThere(x, y)) {
      this.reboundBallXSide();
    }
    else if (inXBounds && !inYBounds) {
      this.reboundBallYSide();
    }
    else if (this.ballMvmtTimer) {
      clearInterval(this.ballMvmtTimer)
    }
  }

  moveBall() {
    this.setState(state => {
      let newX = state.ballPosition[0] + state.ballSpeed[0] * GameManager.timeoutPeriod;
      let newY = state.ballPosition[1] + state.ballSpeed[1] * GameManager.timeoutPeriod;

      this.handleBoundaries(newX, newY);
      return { ballPosition: [newX, newY] };
    })
  }

  render() {
    return (
      <Layer>
         {/* Represent left and right players */}
        <PlayerStick borderLimits={this.props.borderLimits}
          y={this.state.playersY[0]} leftPlayer={true} 
          lengthPlayer={this.state.lengthPlayer}
          />

        <PlayerStick borderLimits={this.props.borderLimits}
          y={this.state.playersY[1]} leftPlayer={false} 
          lengthPlayer={this.state.lengthPlayer}
          />
        

        <Ball borderLimits={this.props.borderLimits} 
          position={this.state.ballPosition}
          size={this.state.ballSize} />
      </Layer>
    );
  }
}


class PongInterface extends Component {
  constructor(props) {
    super(props);

    let leftXLimit = 50, topYLimit = 0;
    let borderLimits = [
      leftXLimit, topYLimit, leftXLimit, heightOpposite(topYLimit),
      widthOpposite(leftXLimit), topYLimit, widthOpposite(leftXLimit), heightOpposite(topYLimit)
    ]; // topLeft, bottomLeft, topRight, bottomRight

    let startBallX = (leftXLimit + widthOpposite(leftXLimit)) / 2;
    let startBallY = (topYLimit + heightOpposite(topYLimit)) / 2;

    this.state = { 
      borderLimits: borderLimits, 
      // startBall: [startBallX, startBallY]
      startBall: [startBallX, 15]
    };
  }

  render() {
    if (this.props.waitingForPlayers) 
      return <h2>Waiting for players</h2>
    
    
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        {/* order of layers is determined by order in which components are declared
        i.e. component declared first will be the one further back */}

        {/* Background Layer */}
        <Layer> 
          <BackgroundRect/>
        </Layer>

        {/* Players + Ball Layer */}
        <GameManager 
          borderLimits={this.state.borderLimits} 
          gameConfig={this.props.gameConfig}
          />

      </Stage>
    );
  }
}

export default PongInterface;