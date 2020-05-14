import io from 'socket.io-client';


const ENDPOINT = "http://localhost:3000"; // server route --> TODO: change for prod


class SocketWrapper {
  constructor(namespace) {
    this.namespace = namespace;
  }

  connect() {
    this.socket = io.connect({ transport : ['websocket']});
  }

  updatePlayerMove(playerIndex, newY) { // [x, y]
    this.socket.emit('player move', { 
      playerIndex: playerIndex,  newY: newY 
    });
  }

  updatePlayerRebound(newPosition, newBallSpeed) {
    this.socket.emit('player rebound', { 
      newBallPosition: newPosition, newBallSpeed: newBallSpeed 
    });
  }

  updatePlayerLostPoint() {
    this.socket.emit('player lost point');
  }
}


const socketGame = new SocketWrapper('/game_synch');


export { socketGame };