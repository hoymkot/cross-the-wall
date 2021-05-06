
PROXY_HOSTNAME = 'localhost' // hostname for local browser to point to
PROXY_LOCAL_PORT = 1337 // port for local browser to point to
PROXY_PUBLIC_HOSTNAME = 'localhost' // public facing hostname or IP for accepting connections from coordinator
SCF_TARGET_LISTENER_PORT = 8124 // public facing port for accepting connections from coordinator
COORDINATOR_HOSTNAME = 'localhost'
COORDINATOR_PORT = 80
CLEAN_LOOKUP_TABLE = 5*60*1000 // every 5 minutes


module.exports = { 
PROXY_HOSTNAME , 
PROXY_LOCAL_PORT , 
PROXY_PUBLIC_HOSTNAME , 
SCF_TARGET_LISTENER_PORT ,
COORDINATOR_HOSTNAME ,
COORDINATOR_PORT,
CLEAN_LOOKUP_TABLE  };
