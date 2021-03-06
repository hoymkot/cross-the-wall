'use strict'

const uuid = require('uuid')
const net = require('net')
const dgram = require('dgram')
const fs = require('fs')
const tls = require('tls')
var StreamCipher = require('stream-cipher')

var crypto 
(async function () {
  crypto = await import('crypto')
})()


const config = require('./config')
const client_socket_table = require('./client_socket_table')


module.exports = {

    // start listening for connections from the Remote Coordinator. Once connected, 
    // pipe the socket of the connection with that of the corresponding client browser
    // connection (identified by a session_id received from the Remote Coordinator.) 
    // Then the client web browser can talk to the target website seamlessly (for a 
    // single http request though) via this tunnel.
    // 
    // session_id is an instance of uuid.v4() 
    // 
    // make sure the listen_port is accessible by the Remote Coordinator if host 
    // running this program lives behind a firewall.
    //
    // TODO: NAT timer needed Timer // timer 

    start(local_interface) {

      // NOTE: here I didn't bind request port because it is working like this in my NAT. but different NAT have different implementation 
      // TODO: bind port to request from the Remote Coordinator. 
      const keep_nat_alive_socket = dgram.createSocket('udp6');
      keep_nat_alive_socket.bind(local_interface.localPort, local_interface.localAddress)
      setInterval(()=>{
        keep_nat_alive_socket.send('nat-keepalive', config.RETURN_IP_PORT_SERVICE.port, config.RETURN_IP_PORT_SERVICE.ip, (err) => {
          if (err == null) {
            console.log("info", new Date().toISOString(), "nat-keep-alive", "packet sent")
          } else {
            console.log("warn", new Date().toISOString(), "nat-keep-alive", err)
          }
        })
      }, config.NAT_KEEP_ALIVE_INTERVAL)

      keep_nat_alive_socket.on('error', (err) => {
        console.log("warn", new Date().toISOString, "keep_nat_alive_socket", err.lineNumber, err)
      });


      let options = {}

      let server = net.createServer(options, (remote_coordinator_socket) => {

        var req_uuid = Buffer.from('')
        const req_uuid_bytes_length = Buffer.from(uuid.v4()).length
        var true_req_uuid = false
        var clientSocket = false

        remote_coordinator_socket.on('data', (data)=>{
          // once user session is identified and sockets are piped to each other. we no long run this routine. 
          if (true_req_uuid == false) { 

            req_uuid = Buffer.concat([req_uuid, data])

            // on connect, uuid v4 is the only fixed length identifier the coordinator will send
            if (req_uuid.length >= req_uuid_bytes_length ) {
              
              true_req_uuid = req_uuid.slice(0, req_uuid_bytes_length).toString()

              data = req_uuid.slice(req_uuid_bytes_length)
              // once we get the uuid, we find the corresponding browser socket from the lookup table
              let socket_package = client_socket_table.getSocket(true_req_uuid)

              clientSocket = socket_package.clientSocket

              // write data from target to client brower
              if (socket_package == false ) {
                console.log("error", new Date().toISOString(), "clientSocket", "no client socket found for uuid " + true_req_uuid)
              } else {

                const algorithm = 'aes-192-cbc';
                var initialization_vector = socket_package.iv.toString('hex')
                var password = socket_package.key.toString('hex')
                var decipher = new StreamCipher(initialization_vector, password, 20, false)
                var cipher = new StreamCipher(initialization_vector, password, 20, true)

                decipher.digest.write(data)
                remote_coordinator_socket.pipe(decipher.digest)
                decipher.digest.pipe(clientSocket)

                clientSocket.pipe(cipher.digest)
                cipher.digest.pipe(remote_coordinator_socket) 


                // everything should be done by this point
              }

            }      
          } 
        })

        remote_coordinator_socket.on('error', (err)=>{
          console.log("warn", new Date().toISOString, "remote_coordinator_socket", err.lineNumber, err)
        })

      });

      server.on('error', (err) => {
        console.log("error", new Date().toISOString, "tunnel_creation_serivce", err.lineNumber, err)
      });


      server.listen({ 
        port: local_interface.localPort,
        host: local_interface.localAddress
      }, () => {});

    }
}