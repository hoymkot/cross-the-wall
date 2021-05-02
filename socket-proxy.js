var net = require('net');

var proxy = net.createServer(function(proxy_socket) {

	console.log("proxy accepting connection")

	var target = new net.Socket();

	target.connect(443, '104.16.178.84', function() {
		console.log('Connected to edx')

		// only read data after connection
		proxy_socket.on('data', function(data) {
			target.write(data)
		});


		target.on('data', function(data) {

			proxy_socket.write(data)
		});

		target.on('end', target.end);

	})

	proxy_socket.on('end', proxy_socket.end);

});

proxy.listen(443, '127.0.0.1')
