'use strict';


var net = require('net');

exports.main_handler = async (event, context, callback) => {
    console.log(Buffer.from(event.body, 'base64').toString())
    var msg = JSON.parse(Buffer.from(event.body, 'base64').toString())

    var resp_msg = await send_request(msg)
    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: resp_msg
    }
}


function send_request(msg) {
    return new Promise(function(resolve, reject) {
        const serverSocket = net.connect(msg['port'] || 80, msg['hostname'], () => {
            var raw = Buffer.from(msg['body'], 'base64').toString()
            serverSocket.write(raw);

            readHTTPMsg(serverSocket, function(raw) {
                var obj = encrypt(JSON.stringify({
                    'body': raw.toString('base64'), // base 64 instead of hex 
                }))
                resolve(obj)
            })
        })

    });

}



function encrypt(str) {
    return str.toString('base64')
}

function readHTTPMsg(clientSocket, action) {
    var header = ""
    var body = ""
    var content_length = 0
    var isSplitted = false
    var raw = Buffer.from('')
    // raw = ''
    clientSocket.on('data', function(data) {
        // raw = raw + data.toString() 
        raw = Buffer.concat([raw, data])

        if (isSplitted == false) {
            header = header + data.toString()
            if (header.includes('\r\n\r\n') == true) {
                var temp = header
                var head_term_idx = temp.indexOf('\r\n\r\n')
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
            action(raw)
            // full message gotten , do something use full
        }
    })

}