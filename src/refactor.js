/* rewrite as functional component eventually */
// class GameManager extends Component {
//   static timeoutPeriod = 10; // ms

//   constructor(props) {
//     super(props);
//     let gameConfig = props.gameConfig; // defined in gameconfig.py in backend

//     this.state = {
//       ballPosition: gameConfig.startBall, // [x, y]
//       ballSpeed: gameConfig.initBallSpeed, // [speedx, speedy], in px/ms
//       ballSize: gameConfig.ballSize, /* height & width */
//       ongoingGame: true, 
//       lengthPlayer: gameConfig.lengthPlayer,  // length of stick of player in px
//       playersY: [props.borderLimits[1], props.borderLimits[1]], // only 2 players for normal case
//       playerIndex: gameConfig.playerIndex, // player on this client
//       playerSpeed: gameConfig.playerSpeed, // px move per keypress
//       playerMvnt: 0 // 0->still, -11->up, 1->down
//     }

//     this.handleKeyDown = this.handleKeyDown.bind(this);
//     this.handleKeyUp = this.handleKeyUp.bind(this);

//     this.runPlay = this.runPlay.bind(this);
//     this.handleBoundaries = this.handleBoundaries.bind(this);
//     this.checkPlayerThere = this.checkPlayerThere.bind(this);
//     this.reboundBallXSide = this.reboundBallXSide.bind(this);
//     this.reboundBallYSide = this.reboundBallYSide.bind(this);
//     this.moveBall = this.moveBall.bind(this);

//     this.handleOtherPlayerUpdate = this.handleOtherPlayerUpdate.bind(this);
//     this.handleBallTouched = this.handleBallTouched.bind(this);
//   }

//   componentDidMount() {
//     this.runPlay();

//     window.addEventListener('keydown', this.handleKeyDown);
//     window.addEventListener('keyup', this.handleKeyUp);

//     // socketGame.socket.on('player move', data => this.handleOtherPlayerUpdate(data));
//     // socketGame.socket.on('ball touched', data => this.handleBallTouched(data));

//     this.userKeyMovesLoop()
//   }


//   userKeyMovesLoop() {
//     setInterval(() => {
//       this.setState((state, props) => {
//         if (state.playerMvnt === 0) return {};

//         let newY = state.playersY[state.playerIndex] + state.playerMvnt * state.playerSpeed;
//         if (state.playerMvnt === -1) { // up
//           newY = Math.max(newY, props.borderLimits[1]);
//         }
//         else if (state.playerMvnt === 1) { // down
//           newY = Math.min(newY, props.borderLimits[3] - state.lengthPlayer);
//         }

//         let newPlayersY = state.playersY;
//         newPlayersY[state.playerIndex] = newY;
//         // sendSocketUpdatePlayerPos(state.playerIndex, newY);

//         return { playersY : newPlayersY };
//       })
//     }, 20);
//   }

//   handleKeyDown(e) {
//     this.setState(state => {
//       if (e.keyCode === 38) return { playerMvnt: -1 };
//       else if (e.keyCode === 40) return { playerMvnt: 1 };
//     });
//   }

//   handleKeyUp(e) {
//     this.setState({ playerMvnt: 0 });
//   }

//   handleOtherPlayerUpdate(update) {
//     this.setState(state => {
//       let newPlayersY = state.playersY;
//       newPlayersY[update.playerIndex] = update.newY;
//       return { playersY: newPlayersY };
//     })
//   }

//   handleBallTouched(update) {
//     console.log('handle ball touched')
//     // this.setState(state => {

//     // })
//   }

//   runPlay() {
//     let ballMvmtTimer = setInterval(() => {
//       this.moveBall();
//     }, 
//     GameManager.timeoutPeriod)

//     this.ballMvmtTimer = ballMvmtTimer;
//   }

//   checkPlayerThere(x, topY) {
//     let bottomY = topY + this.state.ballSize;
//     let limitXLeft = this.props.borderLimits[0];

//     let state = this.state;
//     let playerTop = (x < limitXLeft) ? state.playersY[0] : state.playersY[1];

//     return (bottomY >= playerTop && topY <= playerTop + state.lengthPlayer);
//   }

//   reboundBallXSide() {
//     this.setState((state, props) => {
//       return { ballSpeed: [-state.ballSpeed[0], state.ballSpeed[1]] } 
//     });
//   }

//   reboundBallYSide() {
//     this.setState((state, props) => {
//       return { ballSpeed: [state.ballSpeed[0], -state.ballSpeed[1]] }
//     });
//   }

//   handleBoundaries(x, y) {
//     let inXBounds = isWithinXBoundaries(x, y, this.props.borderLimits, this.state.ballSize);
//     let inYBounds = isWithinYBoundaries(x, y, this.props.borderLimits, this.state.ballSize);
//     if (inXBounds && inYBounds) return;

//     if (!inXBounds && this.checkPlayerThere(x, y)) {
//       this.reboundBallXSide();
//     }
//     else if (inXBounds && !inYBounds) {
//       this.reboundBallYSide();
//     }
//     else if (this.ballMvmtTimer) {
//       clearInterval(this.ballMvmtTimer)
//     }
//   }

//   moveBall() {
//     this.setState(state => {
//       let newX = state.ballPosition[0] + state.ballSpeed[0] * GameManager.timeoutPeriod;
//       let newY = state.ballPosition[1] + state.ballSpeed[1] * GameManager.timeoutPeriod;

//       this.handleBoundaries(newX, newY);
//       return { ballPosition: [newX, newY] };
//     })
//   }

//   render() {
//     return (
//       <Layer>
//          {/* Represent left and right players */}
//         <PlayerStick borderLimits={this.props.borderLimits}
//           y={this.state.playersY[0]} leftPlayer={true} 
//           lengthPlayer={this.state.lengthPlayer}
//           />

//         <PlayerStick borderLimits={this.props.borderLimits}
//           y={this.state.playersY[1]} leftPlayer={false} 
//           lengthPlayer={this.state.lengthPlayer}
//           />
        

//         <Ball borderLimits={this.props.borderLimits} 
//           position={this.state.ballPosition}
//           size={this.state.ballSize} />
//       </Layer>
//     );
//   }
// }