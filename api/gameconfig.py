# ALL dimensions and coords are a ratio of screen size 
# [% of window width, % of window height]
# by default (if height and width same) --> width is used
config = {
  'startBall': [0.5, 0.5],
  'initBallSpeed': [0.0003, -0.0001], 
  # 'initBallSpeed': [0.0, 0.0], 
  # 'ratioBoundaryPlayer': 0.2,
  'ratioBoundaryPlayer': 1.,
  'playerSpeed': 0.17, 
  'ballSize': 0.025
}

pointTimeoutPeriod = 2 # seconds 