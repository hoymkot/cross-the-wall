  
var http = require("http")
  // Make a request to a tunneling proxy
  const options = {
    host: 'service-jjmvpnn2-1304726915.hk.apigw.tencentcs.com',
    path: '/release/helloworld-1619933384982',
    method: 'POST'
  };



  const req = http.request(options, function(response){
    var str = '';

    //another chunk of data has been received, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
      console.log(str);
    });
  })

  req.write("hello world!");

  req.end();
  
  