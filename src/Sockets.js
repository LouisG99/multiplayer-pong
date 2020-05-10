import io from 'socket.io-client';


const ENDPOINT = "http://127.0.0.1:5000";
const socket = io.connect(ENDPOINT, { transport : ['websocket']});

socket.on('ser', function(data) {
  console.log(data);
})

export default socket;