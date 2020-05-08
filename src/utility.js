function widthOpposite(x) {
  return window.innerWidth - x;
}
function heightOpposite(y) {
  return window.innerHeight - y;
}

let isWithinXBoundaries = function(x, y, borderLimits, size) {
  return (x >= borderLimits[0] && x + size <= borderLimits[4]);
};

let isWithinYBoundaries = function(x, y, borderLimits, size) {
  return (y >= borderLimits[1] && y + size <= borderLimits[3])
};


export { 
  widthOpposite, 
  heightOpposite,
  isWithinXBoundaries,
  isWithinYBoundaries
};