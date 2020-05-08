import React, { Component } from 'react';

import { Line } from 'react-konva';

class PlayerStick extends Component {
  constructor(props) {
    super(props);

    let lineWidth = 10;
    let x = props.leftPlayer ? 
      props.borderLimits[0] - lineWidth / 2 
      :
      props.borderLimits[4] + lineWidth / 2;

    this.state = { x: x, lineWidth: lineWidth };
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.y !== this.props.y;
  }

  render() {
    let y = this.props.y;
    let points = [this.state.x, y, this.state.x, y + this.props.lengthPlayer];
    
    return <Line points={points} strokeWidth={this.state.lineWidth} 
      stroke="black"/>;
  }
}


export default PlayerStick;