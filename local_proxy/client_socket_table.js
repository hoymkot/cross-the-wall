const uuid = require('uuid')
const config = require('./config')


// each client could be a browser
// uuid => client(browser) socket look up table

var CLEAN_LOOKUP_TABLE = config.CLEAN_LOOKUP_TABLE

var instance = (function() {
 	let table = {};

  	// periodically remove destroyed client socket from the table
	setTimeout(()=>{
	  table = Object.fromEntries(Object.entries(table).filter(([uuid,clientSocket]) => clientSocket.destroyed == false));
	}, CLEAN_LOOKUP_TABLE)

  	return {
    	addSocket(socket) {
       		let session_id = uuid.v4()
       		while (table[session_id] != undefined){
       			session_id = uuid.v4()
       		}
       		table[session_id] = socket
       		return session_id
    	},

    	getSocket(session_id) {
        	return table[session_id]  || false
    	}
  	};
})();


module.exports =  instance 
