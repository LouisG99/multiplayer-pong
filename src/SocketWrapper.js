import io from 'socket.io-client';


const ENDPOINT = "http://localhost:3000"; // server route --> TODO: change for prod


class SocketWrapper {
  constructor(namespace) {
    this.namespace = namespace;
    this.connected = false;
  }

  connect() {
    if (!this.connected) {
      this.socket = io.connect({ transport : ['websocket']});
      this.connected = true;
    }
  }
  
  disconnect() {
    if (this.connected) {
      this.socket.close();
      this.connected = false;
    }
  }

  updatePlayerMove(playerIndex, newY, mvnt) { // [x, y]
    this.socket.emit('player move', { 
      playerIndex: playerIndex, newY: newY, mvnt: mvnt
    });
  }

  updatePlayerRebound(newPosition, newBallSpeed) {
    let update_ts = Date.now(); // independent of timezones
    this.socket.emit('player rebound', { 
      newBallPosition: newPosition, newBallSpeed: newBallSpeed, ts: update_ts
    });
  }

  updatePlayerLostPoint() {
    this.socket.emit('player lost point');
  }
}


const socketGame = new SocketWrapper('/game_synch');


export { socketGame };