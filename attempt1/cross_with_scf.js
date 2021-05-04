var net = require('net');
var http = require('http');

var options = {
  host: 'https://service-jjmvpnn2-1304726915.hk.apigw.tencentcs.com',
  path: '/release/helloworld-1619933384982'
};


var proxy = net.createServer(function(proxy_socket) {

	console.log("proxy accepting connection")

	var target = new net.Socket();

	http.request(options, function(response) {
		  var str = '';

		  //another chunk of data has been received, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

	}).end();

	target.connect(443, '104.16.178.84', function() {
		console.log('Connected to edx')



		// only read data after connection
		proxy_socket.on('data', function(data) {
			socket.write(Buffer.from(data.toString('hex')))			
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
