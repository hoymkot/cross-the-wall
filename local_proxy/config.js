'use strict'

module.exports = {
 "PROXY_HOSTNAME" : "localhost", // hostname for local browser to point to
 "PROXY_LOCAL_PORT" : 1337, // port for local browser to point to
 "COORDINATOR_HOSTNAME" : "localhost",
 "COORDINATOR_PORT" : 80,
 "RETURN_IP_PORT_SERVICE" : { ip: "[2600:1f14:ca1:de00:639d:c0ab:7bad:d37b]", port: "8080"},
 "EXTERNAL_IP_PORT_REFRESH_INTERVAL" : 5*60*1000,
 "LOOKUP_TABLE_CLEAN_UP_INTERVAL" : 50*1000, // update every 50 seconds that NAT table records normally expired in 60 seconds.
 "NAT_KEEP_ALIVE_INTERVAL" : 25*1000 // send NAT keep alive packets every 25 seconds to keep NAT Table record alive for NAT penetration.
}
