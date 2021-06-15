
// the following is for checking whether udp keep alive packets are received. just for debuging. may remove in the future. 
const dgram = require('dgram');

const config = require('./config');


const keep_nat_alive_socket = dgram.createSocket('udp6');

keep_nat_alive_socket.bind(config.LOCAL_PORT);

keep_nat_alive_socket.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});


keep_nat_alive_socket.on('error', (err) => {
    console.log("warn", new Date().toISOString, "keep_nat_alive_socket", err.lineNumber, err)
});

const http = require('http');
let server = http.createServer(function (req, res) {
  var o = {
  	'ip': (res.socket.remoteAddress),
  	'port' : (res.socket.remotePort),
  }
  console.log("info", new Date().toISOString(), 'HTTP',o)

  res.write(JSON.stringify(o)); //write a response to the client
  res.end(); 
}).listen(config.LOCAL_PORT); 



server.on('error', (err) => {
        console.log("error", new Date().toISOString, __filename, err)
});

// mayber wait a second after everything is ready 
keep_nat_alive_socket.send('hole punching', config.SERVER_PORT, config.SERVER_IP)
