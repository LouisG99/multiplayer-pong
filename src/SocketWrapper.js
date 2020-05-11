import io from 'socket.io-client';


const ENDPOINT = "http://localhost:3000"; // server route --> TODO: change for prod


class SocketWrapper {
  constructor(namespace) {
    this.namespace = namespace;
  }

  connect() {
    this.socket = io.connect({ transport : ['websocket']});
  }

  joinGameRoom() {
    console.log('joining room')
    this.socket.emit('join game', { socketRoom_id: this.gameCode });
  }
}


const socketGame = new SocketWrapper('/game_synch');


export { socketGame };