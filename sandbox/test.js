console.log(module.filename)
const http = require('http');

const options = {
  hostname: '2600:1f14:ca1:de00:639d:c0ab:7bad:d37b',
  // hostname: '34.209.251.143',
  port: 8080,
  // family: 6,
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`ip: ${res.socket.localAddress}`);
  console.log(`port: ${res.socket.localPort}`);

  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.end();

