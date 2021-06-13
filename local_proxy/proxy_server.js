const { URL } = require('url');
const https = require('https')
const http = require('http')

const config = require('./config')
const client_socket_table = require('./client_socket_table')


module.exports = {

  start(network_interface_info){

      // Create an HTTP tunneling proxy server
      const proxy_server = http.createServer((req, res) => {});

      // Now that proxy is running
      proxy_server.listen(config.PROXY_LOCAL_PORT, config.PROXY_HOSTNAME, () => {
          console.log("info", new Date().toISOString(), "localhost poxy started")
      });


      proxy_server.on("error", (err)=>{
        console.log("error", new Date().toISOString(), "proxy_server", err.lineNumber, err)
      })


      // Create an HTTP tunneling proxy
      proxy_server.on('connect', (req, clientSocket, head) => {

        // Connect to an origin server, http or https really doesn't matter in this design
        const { port, hostname } = new URL(`http://${req.url}`);
        let session_id = client_socket_table.addSocket(clientSocket)

        clientSocket.on('error', (err) => {
            console.log("error", new Date().toISOString, "clientSocket", err.lineNumber, session_id, err)
          });
        // accepted a connection from a browser
        // TODO: may make one for HTTP/2 in the future 
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                          'Proxy-agent: Cross-The-Wall-HTTP-Proxy\r\n' +
                          '\r\n');

        console.log("info", new Date().toISOString(), 'req.url',session_id, req.url)



        var connection_info = {
          proxy_hostname: network_interface_info.ip, // let Remote coordinator to hit back to build tunnels 
          proxy_port: network_interface_info.port, 
          target_host_name: hostname,
          target_port: port,
          uuid: session_id
        }
        // make this socket available for latter reference 

        const scf_host_options = {
          hostname: config.COORDINATOR_HOSTNAME,
          port: config.COORDINATOR_PORT,
          method: 'POST',
          rejectUnauthorized: config.ACCEPT_SELF_SIGNED_CERT == false ,  
        }

        const scf_request = https.request(scf_host_options, res => {
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

    }

}
