import React, { Component } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Line } from 'react-konva';

import { widthOpposite, heightOpposite } from './utility';

/**
 * order of layers is determined by order in which components are declared
 * i.e. component declared first will be the one further back
 */

function BorderLine(props) {
  return <Line points={props.points} strokeWidth={10}
          stroke="black" />;
}

/* left and right vertical border line */
function Borders(props) {
  /* points define where MIDDLE of line goes */
  let lineWidth = 10;
  let adjustedPointsLeftBorder = props.borderLimits.slice(0, 4).map((element, i) => {
    if (i % 2 === 0) return element - lineWidth / 2; // only adjust X values
    return element;
  });

  let adjustedPointsRightBorder = props.borderLimits.slice(4).map((element, i) => {
    if (i % 2 === 0) return element + lineWidth / 2; // only adjust X values
    return element;
  });

  return (<>
    <BorderLine points={adjustedPointsLeftBorder}/>
    <BorderLine points={adjustedPointsRightBorder}/>
  </>)
}

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

class GameManager extends Component {
  static timeoutPeriod = 10; // ms

  constructor(props) {
    super(props);

    this.state = {
      ballPosition: props.startBall, // [x, y]
      ballSpeed: [-0.5, 0.5], // [speedx, speedy], in px/ms
      ballSize: 50, /* height & width */
      ongoingGame: true, 
      lengthPlayer: window.innerHeight,  // length of stick of player
      leftPlayerY: 0, // top
      rightPlayerY: 0
    }

    this.runPlay = this.runPlay.bind(this);
    this.handleBoundaries = this.handleBoundaries.bind(this);
    this.checkPlayerThere = this.checkPlayerThere.bind(this);
    this.reboundBallXSide = this.reboundBallXSide.bind(this);
    this.reboundBallYSide = this.reboundBallYSide.bind(this);
    this.moveBall = this.moveBall.bind(this);

    this.runPlay();
  }

  runPlay() {
    let ballMvmtTimer = setInterval(() => {
      this.moveBall();
    }, 
    GameManager.timeoutPeriod)

    this.ballMvmtTimer = ballMvmtTimer;
  }

  checkPlayerThere(x, y) {
    let limitXLeft = this.props.borderLimits[0];

    let state = this.state;
    let playerTop = (x < limitXLeft) ? state.leftPlayerY : state.rightPlayerY;

    return (y >= playerTop && y <= playerTop + state.lengthPlayer);
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
    console.log("handle nounds")
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
    this.setState((state, props) => {
      let newX = state.ballPosition[0] + state.ballSpeed[0] * GameManager.timeoutPeriod;
      let newY = state.ballPosition[1] + state.ballSpeed[1] * GameManager.timeoutPeriod;

      this.handleBoundaries(newX, newY);
      return { ballPosition: [newX, newY] };
    })
  }

  render() {
    return (
      <Layer>
        <Borders borderLimits={this.props.borderLimits}/>
        {/* Represent players for now */}

        <Ball borderLimits={this.props.borderLimits} 
          position={this.state.ballPosition}
          size={this.state.ballSize} />
      </Layer>
    );
  }
}

let isWithinXBoundaries = function(x, y, borderLimits, size) {
  return (x >= borderLimits[0] && x + size <= borderLimits[4]);
};

let isWithinYBoundaries = function(x, y, borderLimits, size) {
  return (y >= borderLimits[1] && y + size <= borderLimits[3])
};

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
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>

        {/* Background Layer */}
        <Layer> 
          <BackgroundRect/>
        </Layer>

        {/* Players + Ball Layer */}
        <GameManager borderLimits={this.state.borderLimits} 
          startBall={this.state.startBall} />
      </Stage>
    );
  }
}

export default PongInterface;