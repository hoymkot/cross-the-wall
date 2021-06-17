 'use strict'

const https = require('https');
const http = require('http');
const net = require('net');
const uuid = require('uuid')
const fs = require('fs');

var crypto 
(async function () {
  crypto = await import('crypto')
})()

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
                    host: target_connection_info['proxy_hostname'],
                    port: target_connection_info['proxy_port'],
                }                    
                  // NOTE: here I didn't bind request port because it is working like this in my NAT. but different NAT have different implementation 
                  // TODO: bind port to request from the Remote Coordinator. 
                var proxySocket = net.connect( options, () => {
                    console.log("info",request_id, new Date().toISOString(), "proxySocket", options, "local proxy connected" )
                    resolve(proxySocket)
                })
                proxySocket.on("error", (err) => {
                    console.log("warn",request_id, new Date().toISOString(), "proxySocket", options, err)
                    reject(err)
                })
            })


            var targetPromise = new Promise((resolve, reject) => {
                let options = {
                    host: target_connection_info['target_host_name'],
                    port: target_connection_info['target_port'],
                }                     
                var targetSocket = net.connect(options, () => {
                    resolve(targetSocket)
                    console.log("info",request_id, new Date().toISOString(), "targetSocket", options, "target connected" )

                })
                targetSocket.on("error", (err) => {
                    console.log("warn", request_id, new Date().toISOString(), "targetSocket", target_connection_info.target_host_name, err)
                    reject(err)
                })
            })

            Promise.all([targetPromise, proxyPromise])
                .then((sockets) => {

                    const algorithm = 'aes-192-cbc';
                    let key = Buffer.from(target_connection_info.key, "hex")
                    let iv = Buffer.from(target_connection_info.iv, "hex")

                    const cipher = crypto.createCipheriv(algorithm, key, iv);

                    sockets[1].write(target_connection_info.uuid)
                    sockets[0].pipe(cipher)
                    cipher.pipe(sockets[1])

                    const decipher = crypto.createDecipheriv(algorithm, key, iv);
                    sockets[1].pipe(decipher)
                    decipher.pipe(socket[0])

                }).catch((err) => {
                    console.log("warn", request_id, new Date().toISOString(), "[targetPromise, proxyPromise]", target_connection_info.target_host_name, target_connection_info.proxy_hostname, "unable to bridge", err)
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
}).listen(config.RETURN_IP_PORT_PORT); 

ip_port.on('error', (err) => {
        console.log("error", new Date().toISOString, __filename, err)
});
