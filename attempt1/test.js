const http = require('http');
const net = require('net');
const { URL } = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  // console.log("write head 7")
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.end('okay');
});

proxy.on('connect', (req, clientSocket, head) => {
    console.log("connect")
    console.log(req.url)

  // Connect to an origin server
  const { port, hostname } = new URL(`http://${req.url}`);
  const serverSocket = net.connect(port || 80, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    console.log(head)
    // TODO: check if this line is necessary
    // serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
});

// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {
    console.log("listen ")

  // // Make a request to a tunneling proxy
  // const options = {
  //   port: 1337,
  //   host: '127.0.0.1',
  //   method: 'CONNECT',
  //   path: 'www.google.com:80'
  // };

  // const req = http.request(options);
  // req.end();

  // req.on('connect', (res, socket, head) => {
  //   console.log('got connected!');

  //   // Make a request over an HTTP tunnel
  //   socket.write('GET / HTTP/1.1\r\n' +
  //                'Host: www.google.com:80\r\n' +
  //                'Connection: close\r\n' +
  //                '\r\n');
  //   socket.on('data', (chunk) => {
  //     // console.log(chunk.toString());
  //   });
  //   socket.on('end', () => {
  //     // proxy.close();
  //   });
  // });
});