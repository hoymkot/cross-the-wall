'use strict'
const axios = require('axios');
const http = require('http')
const net = require('net');
const { URL } = require('url');
const uuid = require('uuid')


const config = require('./config')
const client_socket_table = require('./client_socket_table')

const PROXY_HOSTNAME = config.PROXY_HOSTNAME // hostname for local browser to point to
const PROXY_LOCAL_PORT = config.PROXY_LOCAL_PORT // port for local browser to point to
const COORDINATOR_HOSTNAME = config.COORDINATOR_HOSTNAME
const COORDINATOR_PORT = config.COORDINATOR_PORT
const EXTERNAL_IP_PORT_SERVICE = config.EXTERNAL_IP_PORT_SERVICE
// const EXTERNAL_IP_PORT_REFRESH_INTERVAL = config.EXTERNAL_IP_PORT_REFRESH_INTERVAL
console.log("info", new Date().toISOString(), __filename + " starting")
// Global variables 
var PUBLIC_IP_PORT = {}


// TODO: make it an object
// address and port for serverless cloud function to hit back for data tunneling. 
// update every EXTERNAL_IP_PORT_REFRESH_INTERVAL ( NAT records expires every 60 seconds ) 
function getExternalIpPort(action) {
  axios.get(EXTERNAL_IP_PORT_SERVICE)
    .then((response) => {
      console.log("info", new Date().toISOString(), 'external.ip.port', response.data)
      action(response.data.port) 
      PUBLIC_IP_PORT =  {
                ip : response.data.ip,
                port : response.data.port,
             }
    }).catch(error => {
      // if external ip port reporting service is not available, there is nothing we can do, so we shutdown the program
      console.log("error", new Date().toISOString(), EXTERNAL_IP_PORT_SERVICE, 'external ip port service not available')
      console.log("error", new Date().toISOString(), EXTERNAL_IP_PORT_SERVICE, error)

      console.log("error", new Date().toISOString(), 'system shuts down now')
      process.exit(0)
  });
}


// TODO maybe make it an object
function startTunnelCreationService(listen_port) {

  const tunnel_creation_serivce = net.createServer({}, (scf_target_socket) => {
    // 'connection' listener.
    var req_uuid = Buffer.from('')
    const req_uuid_bytes_length = Buffer.from(uuid.v4()).length
    var true_req_uuid = false
    var clientSocket = false

    scf_target_socket.on('data', (data)=>{
      // once user session is identified and sockets are piped to each other. we no long run this routine. 
      if (true_req_uuid == false) { 
        req_uuid = Buffer.concat([req_uuid, data])
        // on connect, uuid v4 is the only fixed length identifier the coordinator will send
        if (req_uuid.length >= req_uuid_bytes_length ) {
          
          true_req_uuid = req_uuid.slice(0, req_uuid_bytes_length).toString()
          // TODO: check if this req_uuid is the polling uuid from the external ip port reporting service, we don't pipe here.

          data = req_uuid.slice(req_uuid_bytes_length)
          // once we get the uuid, we find the corresponding browser socket from the lookup table
          // TODO: externalize client socket_table to be an object for better coding practice
          clientSocket = client_socket_table.getInstance().getSocket(true_req_uuid)

          // write data from target to client brower
          if (clientSocket == false ) {
            console.log("error", new Date().toISOString(), "clientSocket", "no client socket found for uuid " + true_uuid)
          } else {
            clientSocket.write(data) // todo: may change to pipe
          }

          // TODO: move it to the else block above
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

  tunnel_creation_serivce.on('error', (err) => {
    console.log("error", new Date().toISOString, "tunnel_creation_serivce", err.lineNumber, err)
  });


  tunnel_creation_serivce.listen(listen_port, () => {});

}


getExternalIpPort(startTunnelCreationService)

// ==== TODO: put the following code in a seperate file ====== 









// Create an HTTP tunneling proxy server
const proxy_server = http.createServer((req, res) => {});

// Now that proxy is running
proxy_server.listen(PROXY_LOCAL_PORT, PROXY_HOSTNAME, () => {
    console.log("info", new Date().toISOString(), "localhost poxy started")
});


proxy_server.on("error", (err)=>{
  console.log("error", new Date().toISOString(), "proxy_server", err.lineNumber, err)
})


// Create an HTTP tunneling proxy
proxy_server.on('connect', (req, clientSocket, head) => {

  // Connect to an origin server, http or https really doesn't matter in this design
  const { port, hostname } = new URL(`http://${req.url}`);
  let session_id = client_socket_table.getInstance().addSocket(clientSocket)

  clientSocket.on('error', (err) => {
      console.log("error", new Date().toISOString, "clientSocket", err.lineNumber, session_id, err)
    });
  // accepted a connection from a browser
  // TODO: may make one for HTTP/2 in the future 
  clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');

  console.log("info", new Date().toISOString(), 'req.url',session_id, req.url)



  var connection_info = {
    proxy_hostname: PUBLIC_IP_PORT.ip,
    proxy_port: PUBLIC_IP_PORT.port, // todo there is another reference at scf_target_listener
    target_host_name: hostname,
    target_port: port,
    uuid: session_id
  }
  // make this socket available for latter reference 

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









