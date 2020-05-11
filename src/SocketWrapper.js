import io from 'socket.io-client';


const ENDPOINT = "http://127.0.0.1:5000";
// const socket = io.connect(ENDPOINT, { transport : ['websocket']});

// socket.on('ser', function(data) {
//   console.log(data);
// })

class SocketWrapper {
  constructor(namespace) {
    this.namespace = namespace;
    this.socket = io.connect(ENDPOINT, { transport : ['websocket']});
  }

  joinGameRoom() {
    console.log('joining room')
    this.socket.emit('join game', { socketRoom_id: this.gameCode });
  }

  // handleAllPlayersJoined(callback) {
  //   // this.socket.on('game ready', callback);
  // }
}


const socketGame = new SocketWrapper('/game_synch');


export { socketGame };