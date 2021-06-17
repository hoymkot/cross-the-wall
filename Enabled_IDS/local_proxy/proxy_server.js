'use strict'
const { URL } = require('url')
const http = require('http')
const tls = require('tls')


const config = require('./config')


 module.exports = {

  start(){

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

        const { port, hostname } = new URL(`http://${req.url}`);

        clientSocket.on('error', (err) => {
            console.log("error", new Date().toISOString, "clientSocket", err)
          });

        // accepted a connection from a browser
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                          'Proxy-agent: Cross-The-Wall-HTTP-Proxy\r\n' +
                          '\r\n');

        console.log("info", new Date().toISOString(), 'req.url', req.url)

        var connection_info = {
          target_host_name: hostname,
          target_port: port,
        }


        const options = {
          host: config.COORDINATOR_HOSTNAME,
          port: config.COORDINATOR_PORT,
          rejectUnauthorized: config.ACCEPT_SELF_SIGNED_CERT == false ,  
        }

        var coordinatorSocket = tls.connect(options, () => {
            console.log("info", new Date().toISOString(), "coordinatorSocket", connection_info, "target connected" )

            
            coordinatorSocket.write(JSON.stringify(connection_info))
            clientSocket.pipe(coordinatorSocket)
            coordinatorSocket.pipe(clientSocket)

        })
        coordinatorSocket.on("error", (err) => {
            console.log("warn", new Date().toISOString(), "coordinatorSocket",options, connection_info, err)
        })
      })
  }

}
