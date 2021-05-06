'use strict'

const http = require('http');
const net = require('net');
const {URL} = require('url');
const config = require('./config')
const uuid = require('uuid')

const COORDINATOR_HOSTNAME = config.COORDINATOR_HOSTNAME
const COORDINATOR_PORT = config.COORDINATOR_PORT

// create a server that accept callback info and target info from local proxy 
const proxy = http.createServer((req, res) => {
    const session_id = uuid.v4() // identifier for this session
    if (req.method === "GET") {
        console.log("info", session_id, new Date().toISOString(), req.connection.remoteAddress,"invalid request ")
        res.writeHead(400, {});
        res.end()
    } else if (req.method === "POST") {
        // body should hold callback info and target info from local proxy
        var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        });

        req.on("end", function() {
            var target_connection_info = JSON.parse(body.toString())
            console.log("info", session_id, new Date().toISOString(), req.connection.remoteAddress,"target_connection_info", body.toString())


            var proxyPromise = new Promise((resolve, reject) => {
                var proxySocket = net.connect(target_connection_info['proxy_port'] || 80, target_connection_info['proxy_hostname'], () => {
                    resolve(proxySocket)
                    // TODO:error handling
                })
                proxySocket.on("error", (err) => {
                    console.log("info",session_id, new Date().toISOString(), "proxySocket", target_connection_info.proxy_hostname, err)
                    reject(err)
                })
            })


            var targetPromise = new Promise((resolve, reject) => {
                var targetSocket = net.connect(target_connection_info['target_port'] || 80, target_connection_info['target_host_name'], () => {
                    resolve(targetSocket)
                    // TODO:error handling
                })
                targetSocket.on("error", (err) => {
                    console.log("info", session_id, new Date().toISOString(), "targetSocket", target_connection_info.target_host_name, err)
                    reject(err)
                })
            })

            Promise.all([targetPromise, proxyPromise])
                .then((sockets) => {
                    sockets[1].write(target_connection_info.uuid)
                    sockets[0].pipe(sockets[1])
                    sockets[1].pipe(sockets[0])
                }).catch((err) => {
                    console.log("warning", session_id, new Date().toISOString(), "[targetPromise, proxyPromise]", target_connection_info.target_host_name, target_connection_info.proxy_hostname, "unable to bridge")
                })

        });
    }
});

// Now that proxy is running
proxy.listen(COORDINATOR_PORT, COORDINATOR_HOSTNAME, () => {
    console.log("info", new Date().toISOString(), "coordinator started ")
});

proxy.on("error", (err)=>{
    console.log("error", new Date().toISOString(),  err.toString())    
})
