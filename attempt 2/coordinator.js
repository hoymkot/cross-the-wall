'use strict'

const http = require('http');
const net = require('net');
const {
    URL
} = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
    if (req.method === "GET") {
        res.writeHead(400, {});
        res.end()
    } else if (req.method === "POST") {

        var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        });

        req.on("end", function() {
            var target_connection_info = JSON.parse(body.toString())

            var connect_socket = async () => {

                var proxyPromise = new Promise((resolve, reject) => {
                    var proxySocket = net.connect(target_connection_info['proxy_port'] || 80, target_connection_info['proxy_hostname'] , () => {
                        resolve(proxySocket)
                        // TODO:error handling
                    })
                })


                var targetPromise = new Promise((resolve, reject) => {
                    var targetSocket = net.connect(target_connection_info['target_port']  || 80, target_connection_info['target_host_name'] , () => {
                        resolve(targetSocket)
                        // TODO:error handling
                    })
                })

                var sockets = await Promise.all([targetPromise, proxyPromise])
                sockets[1].write(target_connection_info.uuid)
                sockets[0].pipe(sockets[1])
                sockets[1].pipe(sockets[0])
                // todo what if one fail to connect

            }
            connect_socket()
        });
    }
});


// Now that proxy is running
proxy.listen(80, '127.0.0.1', () => {
    console.log("listen ")
});
