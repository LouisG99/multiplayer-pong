function widthOpposite(x) {
  return window.innerWidth - x;
}
function heightOpposite(y) {
  return window.innerHeight - y;
}

function radToDegree(radAngle) {
  return radAngle * 180.0 / Math.PI;
}

function degreeToRad(degreeAngle) {
  return degreeAngle * Math.PI / 180.0;
}

// returns angle in degree (b/w 0 and 360)
function getAngleFromCoords(x, y, xCenter, yCenter) {
  let xDiff = x - xCenter, yDiff = y - yCenter;
  let radAngle = Math.atan(yDiff / xDiff); // returns value between -pi/2 and pi/2
  if (radAngle > 0 && xDiff < 0 && yDiff < 0) {
    radAngle += Math.PI;
  } else if (radAngle <= 0 && xDiff < 0 && yDiff > 0) {
    radAngle += Math.PI;
  }

  if (radAngle < 0) {
    radAngle += 2 * Math.PI;
  }

  return radToDegree(radAngle);
}

/* relative position defined as under class Ball src/PongInterface
  this returns the position of the actual pixels (i.e. adapted to each clients window)
 */
function getCoordsFromCenterRelative(relativePosition, borderLimits) {
  let [xCenter, yCenter, radius] = getCircleParams(borderLimits);
  return [
    xCenter + relativePosition[0] * radius, 
    yCenter + relativePosition[1] * radius
  ];
}


function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function getDotProduct(vec1, vec2) {
  return vec1[0] * vec2[0] + vec1[1] * vec2[1];
}

function getCircleParams(borderLimits) {
  let xCenter = (getRelativeWidth(borderLimits[0]) + getRelativeWidth(borderLimits[4])) / 2;
  let yCenter = (getRelativeHeight(borderLimits[1]) + getRelativeHeight(borderLimits[3])) / 2;
  let radius = Math.min(
    getRelativeWidth(borderLimits[4]) - getRelativeWidth(borderLimits[0]),
    getRelativeHeight(borderLimits[3]) - getRelativeHeight(borderLimits[1])
  ) / 2;

  return [xCenter, yCenter, radius]
} 

function projectPointOnLine(x, y, slope, yint) {
  var slope2 = -1 / slope;
  var yint2 = y - slope2 * x;
  var nx = (yint2 - yint) / (slope - slope2);
  return {x: nx, y: (slope2 * nx) + yint2};
  // return {x: nx, y: (slope * nx) + yint};
}

function isWithinXBoundaries(x, y, borderLimits, size, speed) {
  if (x < borderLimits[0]) return speed[0] >= 0; // if already changed course, count as within
  if (x + size > borderLimits[4]) return speed[0] <= 0;
  return true;
}

function isWithinYBoundaries(x, y, borderLimits, size, speed) {
  if (y < borderLimits[1]) return speed[1] >= 0;
  else if (y + size > borderLimits[3]) return speed[1] <= 0;
  return true;
}

function getRelativeWidth(n) {
  return n * window.innerWidth;
}
function getRelativeHeight(n) {
  return n * window.innerHeight;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getBaseUrl() {
  if (process.env.NODE_ENV === 'production') return 'domain/';
  else return ''; // proxy to react host for dev
}

/* returns promise containing Raw Response */
function sendPostRequest(url, body) {
  return fetch(getBaseUrl() + url, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/* returns promise containing Raw Response */
function sendGetRequest(url) {
  return fetch(getBaseUrl() + url, {
    method: 'GET', 
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function getRadius(borderLimits, midX, midY) {
  let horiz = midX - borderLimits[0];
  let vertic = midY - borderLimits[1];
  return Math.min(horiz, vertic);
}

function initVec(n) {
  let vec = [];
  for (let i = 0; i < n; ++i) {
    vec.push({});
  }
  return vec;
}

/* [ {start: [x1, y1], end: [x2, y2]} ]
*/
function generatePlayerLimits(borderLimits, numPlayers) {
  const midX = (borderLimits[0] + borderLimits[4]) / 2;
  const midY = (borderLimits[1] + borderLimits[3]) / 2;
  const radius = getRadius(borderLimits, midX, midY);
  const angleStep = 2 * Math.PI / numPlayers;

  let currAngle = 0.0;
  const playerLimits = initVec(numPlayers);
  const firstLim = [getRelativeWidth(midX + radius), getRelativeHeight(midY)]; // start at trigo angle 0, inverse clockwise
  playerLimits[0].start = firstLim;
  playerLimits[numPlayers-1].end = firstLim;

  for (let i = 0; i < numPlayers - 1; ++i) {
    currAngle += angleStep;
    const newX = getRelativeWidth(midX + Math.cos(currAngle) * radius);
    const newY = getRelativeHeight(midY + Math.sin(currAngle) * radius);
    playerLimits[i].end = [newX, newY];
    playerLimits[i+1].start = [newX, newY];
  }

  return playerLimits;
}


export { 
  widthOpposite, 
  heightOpposite, 
  radToDegree,
  degreeToRad,
  getAngleFromCoords,
  getRandomArbitrary,
  getCoordsFromCenterRelative,
  getDistance,
  getDotProduct,
  getCircleParams,
  projectPointOnLine,
  isWithinXBoundaries,
  isWithinYBoundaries, 
  sendPostRequest, 
  sendGetRequest, 
  getRelativeWidth, 
  getRelativeHeight, 
  generatePlayerLimits
};