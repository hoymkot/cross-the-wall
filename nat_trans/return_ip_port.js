const http = require('http');
const config = require('./config')
// return the requester IP (v6) and port for NAT penetration

http.createServer(function (req, res) {
  var o = {
  	'ip': (res.socket.remoteAddress),
  	'port' : (res.socket.remotePort),
  }
  console.log("info", new Date().toISOString(), 'ip.port',o)

  res.write(JSON.stringify(o)); //write a response to the client
  res.end(); 
}).listen(config.port); 



// the following is for checking whether udp keep alive packets are received. just for debuging. may remove in the future. 
const dgram = require('dgram');

const keep_nat_alive_socket = dgram.createSocket('udp6');
keep_nat_alive_socket.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});
keep_nat_alive_socket.bind(config.port);
