import React, { useState, useEffect } from 'react';
import { Rect, Arc } from 'react-konva';

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

function PlayerArc(props) {
  let innerOuterRadiusDiff = 10; // px
  let playerColor = props.isLocalPlayer ? "red" : "black";
  let boundaryColor = props.isLocalPlayer ? "blue" : "grey";
  let boundaryOpacity = 0.2; // between 0 & 1

  return (
    <>
      <Arc 
        x={props.x}
        y={props.y}
        rotation={props.playerRotation}
        angle={props.playerAngle}
        innerRadius={props.innerRadius}
        outerRadius={props.innerRadius + innerOuterRadiusDiff}
        fill={playerColor}
      />
      <Arc 
         x={props.x}
         y={props.y}
         rotation={props.boundaryRotation}
         angle={props.boundaryAngle}
         innerRadius={props.innerRadius}
         outerRadius={props.innerRadius + innerOuterRadiusDiff}
        fill={boundaryColor}
        opacity={boundaryOpacity}
      />
    </>
  );
}


export { 
  BackgroundRect, 
  Ball,
  PlayerArc 
};