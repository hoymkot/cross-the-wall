 'use strict'

const net = require('net');
const tls = require('tls');
const fs = require('fs');

const config = require('./config')


const options = {
  key: fs.readFileSync(config.KEY_FILE),
  cert: fs.readFileSync(config.CERT_FILE)
};

let server = tls.createServer(options, (clientSocket) => {
    let connection_info_buf = Buffer.from('')
    clientSocket.on('data', (data)=>{
      // once user session is identified and sockets are piped to each other. we no long run this routine. 
        if (got_connection_info == false) { 
            idx = data.indexof(Buffer.from('}'), 0) 
            if ( idx == -1 ) {
                connection_info_buf = Buffer.concat([connection_info_buf, data])
            } else {
                connection_info_buf = Buffer.concat([connection_info_buf, data], connection_info_buf.length + idx+1 )
                data = data.slice(idx+1)

                    got_connection_info = true
                    connection_info =  JSON.parse(connection_info_buf.toString());
                    
                    let options = {
                        host: connection_info['target_host_name'],
                        port: connection_info['target_port'],
                    }       
                    targetSocket = net.connect(options, () => {
                        console.log("info", new Date().toISOString(), "targetSocket", options, "target connected" )
                        clientSocket.pipe(targetSocket)  
                        targetSocket.pipe(clientSocket)                      
                    })
                    targetSocket.on("error", (err) => {
                    console.log("warn", new Date().toISOString(), "targetSocket", target_connection_info.target_host_name, err)
                    })
                }
            }
        })
})

server.on("error", (err)=>{
    console.log("error", new Date().toISOString(),  err.toString())    
})


// Now that Remote Coordinator is running
server.listen(config.COORDINATOR_PORT, () => {
    console.log("info", new Date().toISOString(), "coordinator started ")
});
