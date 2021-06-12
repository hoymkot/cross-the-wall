'use strict'
const axios = require('axios');

const config = require('./config')
const client_socket_table = require('./client_socket_table')
const tunnel_service = require('./tunnel_service')
const proxy_server = require('./proxy_server')


async function getPublicFacingIpPort() {
  try {
    // now ip v6 address only
    let link = "http://["+config.RETURN_IP_PORT_SERVICE.ip+"]:"+config.RETURN_IP_PORT_SERVICE.port
    console.log("info", new Date().toISOString(), 'return.ip.port', link)
    const response = await axios.get(link);
    console.log("info", new Date().toISOString(), 'return.ip.port', response.data)
    let s = response.request.socket
    let localPort = s.localPort
    let localAddress = s.localAddress
    s.destroy()    
    await new Promise((resolve, reject) => {
                              s.on("close" , ()=>{
                                console.log("info", new Date().toISOString(), 'return.ip.port', "socket destroyed", s.destroyed)
                                // TODO: may wait couple seconds here if port is not yet close 
                                resolve(true)
                              })  
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
    proxy_server.start(network_interface_info)
  }

})() 
