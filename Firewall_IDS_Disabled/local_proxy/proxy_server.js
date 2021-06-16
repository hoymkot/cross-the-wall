'use strict'
const { URL } = require('url')
const https = require('https')
const http = require('http')


var crypto 
(async function () {
  crypto = await import('crypto')
})()

const webcrypto = require('crypto').webcrypto;
const config = require('./config')
const client_socket_table = require('./client_socket_table')


function generateEncryptionKeys() {

  var password =  webcrypto.getRandomValues(new Uint8Array(config.PASSWORD_SIZE));
  var salt = webcrypto.getRandomValues(new Uint8Array(config.PASSWORD_SIZE));
  var key = crypto.scryptSync(password, salt, 24)
  var iv = crypto.randomFillSync(Buffer.alloc(16))
  
  return {
    key: key.toString('hex'),
    iv : iv.toString('hex')
  }
}

module.exports = {

  start(network_interface_info){

      // Create an HTTP tunneling proxy server, doesn't need to be HTTPS because it is like to run on the same host as the browser
      const proxy_server = http.createServer((req, res) => {});

      // Now that proxy is running
      proxy_server.listen(config.PROXY_LOCAL_PORT, () => {
          console.log("info", new Date().toISOString(), "localhost poxy started")
      });


      proxy_server.on("error", (err)=>{
        console.log("error", new Date().toISOString(), "proxy_server", err.lineNumber, err)
      })


      // Create an HTTP tunneling proxy
      proxy_server.on('connect', (req, clientSocket, head) => {

        let socket_package = generateEncryptionKeys()
        socket_package.clientSocket = clientSocket
        
        // Connect to an origin server, http or https really doesn't matter in this design
        const { port, hostname } = new URL(`http://${req.url}`);
        let session_id = client_socket_table.addSocket(socket_package)

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
          proxy_hostname: network_interface_info.ip, // let Remote coordinator to callback to build tunnels 
          proxy_port: network_interface_info.port, 
          target_host_name: hostname,
          target_port: port,
          uuid: session_id,
          key :socket_package.key.toString('hex'),
          iv :socket_package.iv.toString('hex'),
        }
        // make this socket available for latter reference 

        const coordinator_host_options = {
          hostname: config.COORDINATOR_HOSTNAME,
          port: config.COORDINATOR_PORT,
          method: 'POST',
          rejectUnauthorized: config.ACCEPT_SELF_SIGNED_CERT == false ,  
        }

        const coordinator_request = https.request(coordinator_host_options, res => {
          console.log("info", new Date().toISOString(), 'coordinator_request',session_id, `accessed coordinator statusCode: ${res.statusCode}`)
          if (res.statusCode != 200) {
            console.log("error", new Date().toISOString(), 'coordinator_request',session_id, "statusCode: " + res.statusCode)
            var data = Buffer.from('')
            res.on('data', d => {
              data = Buffer.concat([data, d])
            })
            res.on("end", ()=> {
              console.log("error", new Date().toISOString(), 'coordinator_request', session_id,"body: " + data.toString())
            })
          }

        })
        // send callback info and target info to the remote coordinator 
        coordinator_request.write(Buffer.from(JSON.stringify(connection_info)))
        coordinator_request.end()
        coordinator_request.on("error", (err) => {
          console.log("error", new Date().toISOString(), 'coordinator_request', session_id,err)
        })

      });

    }

}
