const http = require('http');
const net = require('net');
const { URL } = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  // console.log("write head 7")
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.end('okay');
});

proxy.on('connect', (req, clientSocket, head) => {
    console.log("connect")
    console.log(req.url)

  // Connect to an origin server
  const { port, hostname } = new URL(`http://${req.url}`);

  const scf_host = 'service-jjmvpnn2-1304726915.hk.apigw.tencentcs.com'
  const scf_port = 80
  const scf_path = '/release/helloworld-1619933384982'
  const scfSocket = net.connect(scf_port || 80, scf_host, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');

    console.log("proxy accepted request")
    scf_mock_header ='GET '+scf_path+ ' HTTP/1.1\r\n' +
    'Host: '+ scf_host +'\r\n' +
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9\r\n' +
    // 'Accept-Encoding: gzip, deflate, br\r\n' +
    'Accept-Language: en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7,zh-CN;q=0.6\r\n'
    console.log(scf_mock_header)
    scfSocket.write(scf_mock_header)
    scfSocket.write("\r\n")

    console.log("sent request to SCF")

    scfSocket.on('data', function(data) {

      console.log("data from scf " + data.toString())
      // clientSocket.write(data)     
    });
    // clientSocket.on('data', function(data) {

    //   console.log("data from client " + data.toString())
    //   scfSocket.write(data)     
    // });


  })

});



  //   clientScoket.pipe(scfSocket)
  //   // console.log(head)
  //   // TODO: check if this line is necessary
  //   // serverSocket.write(head);

  //   // serverSocket.pipe(clientSocket);
  //   // clientSocket.pipe(serverSocket);
  // });


  // const scf_req = http.request(options, function(response){
  //   var str = '';

  //   //another chunk of data has been received, so append it to `str`
  //   response.on('data', function (chunk) {
  //     str += chunk;
  //   });

  //   //the whole response has been received, so we just print it out here
  //   response.on('end', function () {
  //     console.log(str);
  //   });
  // })

  //  clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
  //                   'Proxy-agent: Node.js-Proxy\r\n' +
  //                   '\r\n');

  //   clientSocket.on('data', function(data) {
  //     scf_req.write(data)
  //   });


  // scf_req.end();


  // const serverSocket = net.connect(port || 80, hostname, () => {
  //   // let the brower knows that this proxy accepted the request
  //   serverSocket.write(head);
  //   serverSocket.pipe(clientSocket);
  //   clientSocket.pipe(serverSocket);
  // });


// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {
    console.log("listen ")


});