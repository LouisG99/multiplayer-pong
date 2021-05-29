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
  let stickWidth = 10; // px
  let boundaryWidth = stickWidth; // px
  let stickStroke = props.isLocalPlayer ? "red" : "black";
  let boundaryStroke = props.isLocalPlayer ? "blue" : "grey";
  let boundaryOpacity = 0.2; // between 0 & 1

  return (
    <>
      <Line 
        points={props.points} 
        strokeWidth={stickWidth} 
        stroke={stickStroke}
      />
      <Line
        points={props.surfaceToCoverLimits}
        strokeWidth={boundaryWidth} 
        stroke={boundaryStroke}
        opacity={boundaryOpacity}
      />
    </>
  );
}

function PlayerStick2(props) {
  const lineWidth = 10; // px

  const points = props.limits.start.concat(props.limits.end);

  return <Line points={points} strokeWidth={lineWidth} stroke="black"/>;
}


export { BackgroundRect, Ball, PlayerStick, PlayerStick2 };