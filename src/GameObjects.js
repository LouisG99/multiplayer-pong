import React, { useState, useEffect } from 'react';
import { Rect, Arc } from 'react-konva';

import { 
  getRelativeWidth, 
  getRelativeHeight,
  getCoordsFromCenterRelative
} from './utility';

function BackgroundRect(props) {
  let backgroundColor = "#94C9F0";

  return <Rect x={0} y={0} width={props.width} height={props.height} 
          fill={backgroundColor} _useStrictMode/>
}

function Ball(props) {
  const backgroundColor = "#ffffff";

  let size = Math.min(getRelativeWidth(props.size), getRelativeHeight(props.size));
   /* position define where center of ball is
  with respect to the center of the circle (see comment in class Ball src/PongInterface.js) */
  let position = getCoordsFromCenterRelative(props.positionToCenter, props.borderLimits);

  return (
    <Rect 
      x={position[0] - size / 2} // offset since Rect expects position of top left corner
      y={position[1] - size / 2} 
      width={size} 
      height={size} 
      fill={backgroundColor}
    />
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