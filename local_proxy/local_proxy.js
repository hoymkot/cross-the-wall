'use strict'
const axios = require('axios');
const http = require('http')
const net = require('net');
const { URL } = require('url');
const uuid = require('uuid')

const config = require('./config')
const client_socket_table = require('./client_socket_table')
const tunnel_service = require('./tunnel_service')


const PROXY_HOSTNAME = config.PROXY_HOSTNAME // hostname for local browser to point to
const PROXY_LOCAL_PORT = config.PROXY_LOCAL_PORT // port for local browser to point to
const COORDINATOR_HOSTNAME = config.COORDINATOR_HOSTNAME
const COORDINATOR_PORT = config.COORDINATOR_PORT
const EXTERNAL_IP_PORT_SERVICE = config.EXTERNAL_IP_PORT_SERVICE



async function getPublicFacingIpPort() {
  try {
    let link = "http://["+config.EXTERNAL_IP_PORT_SERVICE.ip+"]:"+config.EXTERNAL_IP_PORT_SERVICE.port
    console.log("info", new Date().toISOString(), 'return.ip.port', link)
    const response = await axios.get(link);
    console.log("info", new Date().toISOString(), 'return.ip.port', response.data)
    let s = response.request.socket
    let localPort = s.localPort
    let localAddress = s.localAddress
    await new Promise((resolve, reject) => {
                              s.on("close" , ()=>{
                                resolve(true)
                              })
                              s.destroy()      
                            });
    return {
      ip: response.data.ip,
      port: response.data.port,
      localPort: localPort,
      localAddress: localAddress
    }
  } catch (error) {
      console.log("error", new Date().toISOString(), 'return.ip.port', config.EXTERNAL_IP_PORT_SERVICE, error)
      return false
  }
}






function proxyServer(public_ip_port) {

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
    let session_id = client_socket_table.addSocket(clientSocket)

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
      proxy_hostname: public_ip_port.ip,
      proxy_port: public_ip_port.port, // todo there is another reference at scf_target_listener
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

}



// wrapping the main code in async because we want to have some sequential actions for better readability
(async () => { 

  let network_interface_info = await getPublicFacingIpPort()
  if (network_interface_info == false) {
      console.log("error", new Date().toISOString(), 'main', 'Return IP:PORT service not available. Remote Coordinator unable to hit back')
      console.log("error", new Date().toISOString(), 'main', 'system shuts down now')
      process.exit(0)
  } else {
    console.log("info", new Date().toISOString(), 'network_interface_info', network_interface_info)
    tunnel_service.start(network_interface_info)
    proxyServer(network_interface_info)
  }

})() 
