var net = require('net');

var server = net.createServer(function(socket) {
	socket.write('Echo server\r\n');

	socket.on('data', function(data) {
		console.log(data.toString())
		// socket.write(data)
		// console.log(data.toString('hex'))
		// socket.write(Buffer.from(data.toString('hex')))
	});
});

server.listen(8001, '127.0.0.1');