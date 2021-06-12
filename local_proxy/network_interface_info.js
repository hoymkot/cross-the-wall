'use strict'

const axios = require('axios');

const config = require('./config')



// access a the Return Ip Port serive to get publicly facing ip and port and enter a record on the NAT table for NAT penetration.
// return public IP:port and local IP:port 
// this socket used in this function must be closed because we are going to reuse the local port for NAT penetration.
module.exports = { 
  getNetworkInfo : async function() {
    try {
      // now support ip v6 address only, note your os must enable ipv6 for this to work, and some os requires you to manually enable 
      let link = "http://"+config.RETURN_IP_PORT_SERVICE.ip+":"+config.RETURN_IP_PORT_SERVICE.port
      console.log("info", new Date().toISOString(), __filename, link)
      const response = await axios.get(link);
      console.log("info", new Date().toISOString(), __filename, response.data)
      
      let s = response.request.socket
      let localPort = s.localPort
      let localAddress = s.localAddress
      let info = {
        ip: response.data.ip,
        port: response.data.port,
        localPort: localPort,
        localAddress: localAddress
      }
      s.destroy()   

      // wait for the socket to close because we are going to reuse the local port for NAT penetration
      await new Promise((resolve, reject) => {
                                s.on("close" , ()=>{
                                  console.log("info", new Date().toISOString(), __filename, "socket destroyed", s.destroyed)
                                  // TODO: may wait couple seconds here if port is not yet close, need testing to verify though
                                  resolve(true)
                                })  
                              });
      return info
    } catch (error) {
        console.log("error", new Date().toISOString(), __filename, config.EXTERNAL_IP_PORT_SERVICE, error)
        return false
    }
  }
}