'use strict'

const http = require('http');
const config = require('./config')
// return the requester IP (v6) and port for NAT penetration


// the following is for checking whether udp keep alive packets are received. just for debuging. may remove in the future. 
const dgram = require('dgram');

const keep_nat_alive_socket = dgram.createSocket('udp6');
keep_nat_alive_socket.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  keep_nat_alive_socket.send('hole ready', rinfo.port, rinfo.address)
  var options = {
    port: rinfo.port,
    host: rinfo.address,
    // method: 'CONNECT',    
  };
	// options = {
	//   host: 'www.google.com',
	// };

 	const req = http.request(options);
	req.socket.bind(config.SERVER_PORT)
	req.on("error", (err) => {
	  console.log("Error: " + err.message);
	})
	req.end();

	  req.on('connect', (res, socket, head) => {
	    console.log('got connected!');

	    // Make a request over an HTTP tunnel
	    socket.write('GET / HTTP/1.1\r\n' +
	                 'Host: www.google.com:80\r\n' +
	                 'Connection: close\r\n' +
	                 '\r\n');
	    socket.on('data', (chunk) => {
	      console.log(chunk.toString());
	    });
	    socket.on('end', () => {
	      proxy.close();
	    });
	  });
	// req.on("error", (err) => {
 //  		console.log("Error: " + err.message);
	// });
	// req.end();
	// req.once('response', (res) => {
	//   const ip = req.socket.localAddress;
	//   const port = req.socket.localPort;
	//   console.log(`Your IP address is ${ip} and your source port is ${port}.`);
	//   // Consume response object
	// });

});
keep_nat_alive_socket.bind(config.SERVER_PORT);

