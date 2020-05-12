function widthOpposite(x) {
  return window.innerWidth - x;
}
function heightOpposite(y) {
  return window.innerHeight - y;
}

function isWithinXBoundaries(x, y, borderLimits, size) {
  return (x >= borderLimits[0] && x + size <= borderLimits[4]);
}

function isWithinYBoundaries(x, y, borderLimits, size) {
  return (y >= borderLimits[1] && y + size <= borderLimits[3])
}


/* returns promise containing Raw Response */
function sendPostRequest(url, body) {
  return fetch(url, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/* returns promise containing Raw Response */
function sendGetRequest(url) {
  return fetch(url, {
    method: 'GET', 
    headers: {
      'Content-Type': 'application/json'
    }
  });
}


export { 
  widthOpposite, 
  heightOpposite,
  isWithinXBoundaries,
  isWithinYBoundaries, 
  sendPostRequest, 
  sendGetRequest
};