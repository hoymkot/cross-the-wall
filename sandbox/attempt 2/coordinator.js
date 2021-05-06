'use strict'

const http = require('http');
const net = require('net');
const {URL} = require('url');

const COORDINATOR_HOSTNAME = 'localhost'
const COORDINATOR_PORT = 80

// create a server that accept callback info and target info from local proxy 
const proxy = http.createServer((req, res) => {
    if (req.method === "GET") {
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
            console.log("info", new Date().toISOString(), "target_connection_info", body.toString())


            var proxyPromise = new Promise((resolve, reject) => {
                var proxySocket = net.connect(target_connection_info['proxy_port'] || 80, target_connection_info['proxy_hostname'], () => {
                    resolve(proxySocket)
                    // TODO:error handling
                })
                proxySocket.on("error", (err) => {
                    console.log("info", new Date().toISOString(), "proxySocket", err)
                    reject(err)
                })
            })


            var targetPromise = new Promise((resolve, reject) => {
                var targetSocket = net.connect(target_connection_info['target_port'] || 80, target_connection_info['target_host_name'], () => {
                    resolve(targetSocket)
                    // TODO:error handling
                })
                targetSocket.on("error", (err) => {
                    console.log("info", new Date().toISOString(), "targetSocket", err)
                    reject(err)
                })
            })

            Promise.all([targetPromise, proxyPromise])
                .then((sockets) => {
                    sockets[1].write(target_connection_info.uuid)
                    sockets[0].pipe(sockets[1])
                    sockets[1].pipe(sockets[0])
                }).catch((err) => {
                    console.log("warning", new Date().toISOString(), "[targetPromise, proxyPromise]", "unable to bridge")
                })

        });
    }
});


// Now that proxy is running
proxy.listen(COORDINATOR_PORT, COORDINATOR_HOSTNAME, () => {
    console.log("coordinator started ")
});
