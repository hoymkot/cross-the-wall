'use strict';


var net = require('net');

exports.main_handler = async (event, context,callback ) => {
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



  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: Buffer.from(event.body, 'base64').toString()
  }
}
