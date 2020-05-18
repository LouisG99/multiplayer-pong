function widthOpposite(x) {
  return window.innerWidth - x;
}
function heightOpposite(y) {
  return window.innerHeight - y;
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

console.log(process.env.NODE_ENV)

export { 
  widthOpposite, 
  heightOpposite,
  isWithinXBoundaries,
  isWithinYBoundaries, 
  sendPostRequest, 
  sendGetRequest, 
  getRelativeWidth, 
  getRelativeHeight
};