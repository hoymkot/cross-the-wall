
// wrapping the main code in async because we want to have some sequential actions for better readability
// (async () => { 
(async () => { 
  const config = require('./config')
  const network_interface_info = require('./network_interface_info')
  const tunnel_service = require('./tunnel_service')
  const proxy_server = require('./proxy_server')

  let info = await network_interface_info.getNetworkInfo()
  if (info == false) {
      console.log("error", new Date().toISOString(), 'main', 'Return IP:PORT service not available. Remote Coordinator unable to hit back')
      console.log("error", new Date().toISOString(), 'main', 'system shuts down now')
      process.exit(0)
  } else {
    console.log("info", new Date().toISOString(), 'network_interface_info', info)
    tunnel_service.start(info)
    proxy_server.start(info)
  }

})() 
