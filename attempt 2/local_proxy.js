'use strict';
const http = require('http')
const net = require('net');
const { URL } = require('url');
const uuid = require('uuid')



// uuid => client socket mapping 
var client_socket_table = { }

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {});

const scf_target_listener = net.createServer({}, (scf_target_socket) => {
  // 'connection' listener.
  var uuid = Buffer.from('')
  const uuid_bytes_length = Buffer.from('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b').length
  true_uuid = false
  clientSocket = false
  scf_target_socket.on('data', (data)=>{
    if (true_uuid == false) {
      uuid = Buffer.concat(uuid, data)
      if (uuid.length >= uuid_bytes_length ) {
        true_uuid = uuid.slice(0, uuid_bytes_length).toString()
        data = uuid.slice(uuid_bytes_length)
        clientSocket = client_socket_table[true_uuid] || false
        // write data from target to client brower
        if (clientSocket == false ) {
          console.log("no client socket found for uuid " + true_uuid)
        } else {
          clientSocket.write(data) // todo: may change to pipe
        }

        clientSocket.pipe(scf_target_socket) // everything should be done by this point
      }      
    } else {
      // write data to browser socket
        if (clientSocket == false ) {
          console.log("no client socket found for uuid " + true_uuid)
        } else {
          clientSocket.write(data) // todo: may change to pipe
        }
    }
  })
});
scf_target_listener.on('error', (err) => {
  throw err;
});

scf_target_listener.listen(8124, () => {});




// Create an HTTP tunneling proxy
proxy.on('connect', (req, clientSocket, head) => {
    // accepted a connection from a browser
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');

  // Connect to an origin server
  const { port, hostname } = new URL(`http://${req.url}`);

  var connection_info = {
    proxy_hostname: 'localhost',
    proxy_port: 1559,
    target_host_name: hostname,
    target_port: port,
    uuid: uuid.v4()
  }
  // make this socket available for latter reference 
  client_socket_table[connection_info.uuid] = clientSocket
  // console.log(req.url)

  const scf_host_options = {
    hostname: 'localhost',
    port: 80,
    method: 'POST'
  }
  const scf_request = http.request(scf_host_options, res => {
    console.log(`statusCode: ${res.statusCode}`)
    res.on('data', d => {
      process.stdout.write(d)
    })
  })
  scf_request.write(Buffer.from(JSON.stringify(connection_info)))
  scf_request.end()

});

// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {
    console.log("listen ")
});
