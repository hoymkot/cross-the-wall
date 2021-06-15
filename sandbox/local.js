
// the following is for checking whether udp keep alive packets are received. just for debuging. may remove in the future. 
const dgram = require('dgram');

const config = require('./config');


const keep_nat_alive_socket = dgram.createSocket('udp6');

keep_nat_alive_socket.bind(config.SERVER_PORT);

keep_nat_alive_socket.send('hole punching', config.RETURN_IP_PORT_SERVICE.port, config.port.ip)


keep_nat_alive_socket.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});


keep_nat_alive_socket.on('error', (err) => {
    console.log("warn", new Date().toISOString, "keep_nat_alive_socket", err.lineNumber, err)
});



