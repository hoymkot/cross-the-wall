
PROXY_HOSTNAME = 'localhost' // hostname for local browser to point to
PROXY_LOCAL_PORT = 1337 // port for local browser to point to
COORDINATOR_HOSTNAME = 'localhost'
COORDINATOR_PORT = 80
EXTERNAL_IP_PORT_SERVICE = 'http://localhost:8080'

// EXTERNAL_IP_PORT_SERVICE = 'http://34.209.251.143:8080'
// EXTERNAL_IP_PORT_REFRESH_INTERVAL = 5*60*1000
CLEAN_LOOKUP_TABLE = 50*1000 // update every 50 seconds that NAT table records normally expired in 60 seconds.

module.exports = { 
	PROXY_HOSTNAME , 
	PROXY_LOCAL_PORT , 
	COORDINATOR_HOSTNAME ,
	COORDINATOR_PORT,
	CLEAN_LOOKUP_TABLE,
	EXTERNAL_IP_PORT_SERVICE,
	// EXTERNAL_IP_PORT_REFRESH_INTERVAL,
 };
