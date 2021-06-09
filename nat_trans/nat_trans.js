var http = require('http');

// return the requester IP and port for NAT penetration
http.createServer(function (req, res) {
  var o = {
  	'ip': (res.socket.remoteAddress),
  	'port' : (res.socket.remotePort),
  }
  res.write(JSON.stringify(o)); //write a response to the client
  res.end(); //end the response
}).listen(8080); //the server object listens on port 8080