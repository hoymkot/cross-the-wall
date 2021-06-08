'use strict'
const http = require('http')
const net = require('net');
const { URL } = require('url');
const uuid = require('uuid')
const config = require('./config')

// todo here is the configuration, may externalize it to a config files
const PROXY_HOSTNAME = config.PROXY_HOSTNAME // hostname for local browser to point to
const PROXY_LOCAL_PORT = config.PROXY_LOCAL_PORT // port for local browser to point to
const PROXY_PUBLIC_HOSTNAME = config.PROXY_PUBLIC_HOSTNAME // public facing hostname or IP for accepting connections from coordinator
const SCF_TARGET_LISTENER_PORT = config.SCF_TARGET_LISTENER_PORT // public facing port for accepting connections from coordinator
const COORDINATOR_HOSTNAME = config.COORDINATOR_HOSTNAME
const COORDINATOR_PORT = config.COORDINATOR_PORT

// each client could be a browser
// uuid => client(browser) socket look up table
var client_socket_table = { }

setTimeout(()=>{
  client_socket_table= Object.fromEntries(Object.entries(client_socket_table).filter(([uuid,clientSocket]) => clientSocket.destroyed == false));
}, config.CLEAN_LOOKUP_TABLE)

// Create an HTTP tunneling proxy server
const proxy_server = http.createServer((req, res) => {});

// Now that proxy is running
proxy_server.listen(PROXY_LOCAL_PORT, PROXY_HOSTNAME, () => {
    console.log("info", new Date().toISOString(), "localhost poxy started")
});


proxy_server.on("error", (err)=>{
  console.log("error", new Date().toISOString(), "proxy_server", err.lineNumber, err)
})



const scf_target_listener = net.createServer({}, (scf_target_socket) => {
  // 'connection' listener.
  var uuid = Buffer.from('')
  const uuid_bytes_length = Buffer.from('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b').length
  var true_uuid = false
  var clientSocket = false

  scf_target_socket.on('data', (data)=>{
    if (true_uuid == false) { // this check is actually very important
      uuid = Buffer.concat([uuid, data])
      // on connect, uuid v4 is the only fixed length identifier the coordinator will send
      if (uuid.length >= uuid_bytes_length ) {
        
        true_uuid = uuid.slice(0, uuid_bytes_length).toString()
        data = uuid.slice(uuid_bytes_length)
        // once we get the uuid, we find the corresponding browser socket from the lookup table
        clientSocket = client_socket_table[true_uuid] || false

        // write data from target to client brower
        if (clientSocket == false ) {
          console.log("error", new Date().toISOString(), "clientSocket", "no client socket found for uuid " + true_uuid)
        } else {
          clientSocket.write(data) // todo: may change to pipe
        }

        // connect client socket and scf target server socket
        clientSocket.pipe(scf_target_socket) 
        scf_target_socket.pipe(clientSocket) 
        // everything should be done by this point
      }      
    } 
  })

  scf_target_socket.on('error', (err)=>{
    console.log("warning", new Date().toISOString, "scf_target_socket", err.lineNumber, err)
  })
});

scf_target_listener.on('error', (err) => {
  console.log("error", new Date().toISOString, "scf_target_listener", err.lineNumber, err)
});

scf_target_listener.listen(SCF_TARGET_LISTENER_PORT, () => {});













// Create an HTTP tunneling proxy
proxy_server.on('connect', (req, clientSocket, head) => {
  // Connect to an origin server, http or https really doesn't matter in this design
  const { port, hostname } = new URL(`http://${req.url}`);
  var session_id = uuid.v4()

    clientSocket.on('error', (err) => {
      console.log("error", new Date().toISOString, "clientSocket", err.lineNumber, session_id, err)
    });
    // accepted a connection from a browser
    // todo: may make one for HTTP/2 in the future 
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');

  console.log("info", new Date().toISOString(), 'req.url',session_id, req.url)
  var connection_info = {
    proxy_hostname: PROXY_PUBLIC_HOSTNAME,
    proxy_port: SCF_TARGET_LISTENER_PORT, // todo there is another reference at scf_target_listener
    target_host_name: hostname,
    target_port: port,
    uuid: session_id
  }
  // make this socket available for latter reference 
  client_socket_table[session_id] = clientSocket

  const scf_host_options = {
    hostname: COORDINATOR_HOSTNAME,
    port: COORDINATOR_PORT,
    method: 'POST'
  }

  const scf_request = http.request(scf_host_options, res => {
    if (res.statusCode != 200) {
      console.log("error", new Date().toISOString(), 'scf_request',session_id, "statusCode: " + res.statusCode)
      var data = Buffer.from('')
      res.on('data', d => {
        data = Buffer.concat([data, d])
      })
      res.on("end", ()=> {
        console.log("error", new Date().toISOString(), 'scf_request', session_id,"body: " + data.toString())
      })
    }

  })
  // send callback info and target info to the remote coordinator 
  scf_request.write(Buffer.from(JSON.stringify(connection_info)))
  scf_request.end()
  scf_request.on("error", (err) => {
    console.log("error", new Date().toISOString(), 'scf_request', session_id,err)
  })

});

