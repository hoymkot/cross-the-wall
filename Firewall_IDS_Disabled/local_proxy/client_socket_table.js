'use strict'


const uuid = require('uuid')
const config = require('./config')


// each client could be a browser
// uuid => client(browser) socket look up table


var instance = (function() {
 	let table = {};
  let keyTable = {} 

  // periodically remove destroyed client socket from the table
	setTimeout(()=>{
	  table = Object.fromEntries(Object.entries(table).filter(([uuid,socket_package]) => socket_package.clientSocket.destroyed == false));
	}, config.LOOKUP_TABLE_CLEAN_UP_INTERVAL)

  	return {
    	addSocket(socket_package) {
       		let session_id = uuid.v4()
       		while (table[session_id] != undefined){
       			session_id = uuid.v4()
       		}

       		table[session_id] = socket_package
       		return session_id
    	},



    	getSocket(session_id) {
        	return table[session_id]  || false
    	}
  	};
})();


module.exports =  instance 
