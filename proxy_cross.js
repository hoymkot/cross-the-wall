const http = require('http');
const net = require('net');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
    // console.log("write head 7")
    // res.writeHead(200, { 'Content-Type': 'text/plain' });
    // res.end('okay');
});

function readRequest(clientSocket, scfSocket , sendReqToScf) {
    header = ""
    body = ""
    content_length = 0
    isSplitted = false
    // raw = Buffer.from('')
    raw = ''
    clientSocket.on('data', function(data) {
        raw = raw + data.toString() 
        // raw = Buffer.concat([raw , data])

        if (isSplitted == false) {
            header = header + data.toString()
            if (header.includes('\r\n\r\n') == true) {
                temp = header
                head_term_idx = temp.indexOf('\r\n\r\n')
                header = temp.substring(0, head_term_idx)
                body = temp.substring(head_term_idx + 4)
                isSplitted = true
                temp = header.substring(header.indexOf('Content-Length: ') + 16)
                content_length = parseInt(temp.substring(0, temp.indexOf("\r\n")))
                console.log(header)
                console.log(body)
                console.log(content_length)
            }
        } else {
            body = body + data.toString()
        }

        if (content_length == body.length) {
            console.log(body)
            sendReqToScf(raw, scfSocket)
            // full message gotten , do something use full
        }
    })

}
proxy.on('connect', (req, clientSocket, head) => {
    console.log("connect")
    console.log(req.url)

    // Connect to an origin server
    const {
        port,
        hostname
    } = new URL(`http://${req.url}`);

    const scf_host = 'service-jjmvpnn2-1304726915.hk.apigw.tencentcs.com'
    const scf_port = 80
    const scf_path = '/release/helloworld-1619933384982'
    const scfSocket = net.connect(scf_port || 80, scf_host, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node.js-Proxy\r\n' +
            '\r\n');

        console.log("proxy accepted request")

        readRequest(clientSocket, scfSocket, function(raw, scfSocket) {
            hex = raw
            console.log("sent request to SCF")
            scf_mock_header = 'POST ' + scf_path + ' HTTP/1.1\r\n' +
                'Host: ' + scf_host + '\r\n' +
                // TODO: may enable compression in the future 
                'Content-Length: ' + hex.length + '\r\n'
            // 'Accept-Encoding: gzip, deflate, br\r\n' 
            scfSocket.write(scf_mock_header)
            scfSocket.write("\r\n")
            // TODO: need to encrypt the following raw string to avoid being caught by the firewall 
            scfSocket.write(hex)

        })

        // receiving data from SCF 
        scf_resp_header = ""
        scf_resp_body = ""
        scf_content_length = 0
        isSplitted = false
        scfSocket.on('data', function(data) {
            if (isSplitted == false) {
                scf_resp_header = scf_resp_header + data.toString()
                if (scf_resp_header.includes('\r\n\r\n') == true) {
                    temp = scf_resp_header
                    head_term_idx = temp.indexOf('\r\n\r\n')
                    scf_resp_header = temp.substring(0, head_term_idx)
                    scf_resp_body = temp.substring(head_term_idx + 4)
                    isSplitted = true
                    temp = scf_resp_header.substring(scf_resp_header.indexOf('Content-Length: ') + 16)
                    scf_content_length = parseInt(temp.substring(0, temp.indexOf("\r\n")))
                    console.log(scf_resp_header)
                    console.log(scf_resp_body)
                    console.log(scf_content_length)
                }
            } else {
                scf_resp_body = scf_resp_body + data.toString()
            }

            if (scf_content_length == scf_resp_body.length) {
                console.log(scf_resp_body)
                // full message gotten , do something use full
            }
        });
    })
});



// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {
    console.log("listen ")

});
