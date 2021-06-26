# ALL dimensions and coords are a ratio of screen size 
# [% of window width, % of window height]
# by default (if height and width same) --> width is used
config = {
  # 'startBall': [0.5, 0.5],
  'startBall': [0, 0],  
  'initBallSpeed': [8e-4, -8e-4], 
  # 'initBallSpeed': [0.0, 0.0], 
  # 'ratioBoundaryPlayer': 0.2,
  'ratioBoundaryPlayer': 1.,
  'playerSpeed': 0.17, 
  'ballSize': 0.025
}

pointTimeoutPeriod = 2 # seconds 