const uuid = require('uuid')
const net = require('net')
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

    start(listen_port) {

      const server = net.createServer({}, (remote_coordinator_socket) => {

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
              clientSocket = client_socket_table.getSocket(true_req_uuid)

              // write data from target to client brower
              if (clientSocket == false ) {
                console.log("error", new Date().toISOString(), "clientSocket", "no client socket found for uuid " + true_uuid)
              } else {
                clientSocket.write(data) // write residual data
                // connect client socket and Remote Coordinator socket
                clientSocket.pipe(remote_coordinator_socket) 
                remote_coordinator_socket.pipe(clientSocket) 
                // everything should be done by this point
              }

            }      
          } 
        })

        remote_coordinator_socket.on('error', (err)=>{
          console.log("warning", new Date().toISOString, "remote_coordinator_socket", err.lineNumber, err)
        })

      });

      server.on('error', (err) => {
        console.log("error", new Date().toISOString, "tunnel_creation_serivce", err.lineNumber, err)
      });


      server.listen(listen_port, () => {});

    }
}