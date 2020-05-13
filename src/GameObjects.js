import React, { useState, useEffect } from 'react';
import { Rect, Line } from 'react-konva';

import { getRelativeWidth, getRelativeHeight } from './utility';

function BackgroundRect(props) {
  let backgroundColor = "#94C9F0";

  return <Rect x={0} y={0} width={props.width} height={props.height} 
          fill={backgroundColor} _useStrictMode/>
}

function Ball(props) {
  /* x, y define where top left of object is */
  const backgroundColor = "#ffffff";

  let size = getRelativeWidth(props.size);
  let x = getRelativeWidth(props.position[0]); // no offset since defines top-left
  let y = getRelativeHeight(props.position[1]);

  return (
    <Rect x={x} y={y} width={size} height={size} fill={backgroundColor}/>
  )
}

function PlayerStick(props) {
  let lineWidth = 10; // px

  let length = getRelativeHeight(props.lengthPlayer);
  let y = getRelativeHeight(props.y);
  let x = props.leftPlayer ? 
    getRelativeWidth(props.borderLimits[0]) - lineWidth / 2 
    :
    getRelativeWidth(props.borderLimits[4]) + lineWidth / 2;
  
  let points = [x, y, x, y + length];

  return <Line points={points} strokeWidth={lineWidth} stroke="black"/>;
}


export { BackgroundRect, Ball, PlayerStick };