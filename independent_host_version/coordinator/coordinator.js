 'use strict'

const https = require('https');
const http = require('http');
const net = require('net');
const uuid = require('uuid')
const fs = require('fs');
const tls = require('tls');

const config = require('./config')


const options = {
  key: fs.readFileSync(config.KEY_FILE),
  cert: fs.readFileSync(config.CERT_FILE)
};


// create a server that accept callback info and target info from local proxy 
const coordinator = https.createServer(options, (req, res) => {
    const request_id = uuid.v4() // identifier for this request to link related logs
    if (req.method === "GET") {
        console.log("info", request_id, new Date().toISOString(), req.connection.remoteAddress,"invalid request ")
        res.writeHead(400, {});
        res.end()
    } else if (req.method === "POST") {
        console.log("info", request_id, new Date().toISOString(),"accepting request from ", req.connection.remoteAddress)
        // body should hold callback info and target info from local proxy
        var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        });

        req.on("end", function() {

            // TODO: decrypt target_connection_info 
            var target_connection_info = JSON.parse(body.toString())
            console.log("info", request_id, new Date().toISOString(), req.connection.remoteAddress,"target_connection_info", body.toString())


            var proxyPromise = new Promise((resolve, reject) => {
                let options = {
                    key: fs.readFileSync(config.KEY_FILE),
                    cert: fs.readFileSync(config.CERT_FILE),
                    host: target_connection_info['proxy_hostname'],
                    port: target_connection_info['proxy_port'],
                    checkServerIdentity: () => { return null; }, // the local proxy is most likely to use self-sign certs 
                    // ca: [ fs.readFileSync(config.CERT_FILE) ], // not nec
                    rejectUnauthorized: false, // always false, because we don't expect clients (local proxy) to have certs
                }                    


                var proxySocket = tls.connect( options, () => {
                    console.log("info",request_id, new Date().toISOString(), "proxySocket", options, "local proxy connected" , proxySocket.authorized ? 'authorized' : 'unauthorized')
                    resolve(proxySocket)
                })
                proxySocket.on("error", (err) => {
                    console.log("info",request_id, new Date().toISOString(), "proxySocket", options, err)
                    reject(err)
                })
            })


            var targetPromise = new Promise((resolve, reject) => {
                var targetSocket = net.connect(target_connection_info['target_port'] || 80, target_connection_info['target_host_name'], () => {
                    resolve(targetSocket)
                    // TODO:error handling
                })
                targetSocket.on("error", (err) => {
                    console.log("info", request_id, new Date().toISOString(), "targetSocket", target_connection_info.target_host_name, err)
                    reject(err)
                })
            })

            Promise.all([targetPromise, proxyPromise])
                .then((sockets) => {
                    sockets[1].write(target_connection_info.uuid)
                    sockets[0].pipe(sockets[1])
                    sockets[1].pipe(sockets[0])
                }).catch((err) => {
                    console.log("warning", request_id, new Date().toISOString(), "[targetPromise, proxyPromise]", target_connection_info.target_host_name, target_connection_info.proxy_hostname, "unable to bridge", err)
                })

        });
    }
});

coordinator.on("error", (err)=>{
    console.log("error", new Date().toISOString(),  err.toString())    
})


// Now that proxy is running
coordinator.listen(config.COORDINATOR_PORT, () => {
    console.log("info", new Date().toISOString(), "coordinator started ")
});



let ip_port = http.createServer(function (req, res) {
  var o = {
    'ip': (res.socket.remoteAddress),
    'port' : (res.socket.remotePort),
  }
  console.log("info", new Date().toISOString(), 'ip.port',o)

  res.write(JSON.stringify(o)); //write a response to the client
  res.end(); 
}).listen(config.port); 

ip_port.on('error', (err) => {
        console.log("error", new Date().toISOString, __filename, err)
});
