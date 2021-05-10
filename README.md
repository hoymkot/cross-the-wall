## Milestone Features:
* able to watch youtube via this proxy
* able to check gmail 
* log request 
* each service component is pluggable.

## Structure 
**Client Web Browser** <=> **Local Proxy** <=> **Firewall** <=> **Remote Coordinator** <=> **Target Web Server**

### Local Proxy 
** live behind the firewall
** act as a ordinary http proxy for a client web browser. 
** send target web site info to the Remote Coordinator
** wait for a seperation connection from the Remote Coordinator. now the Remote Coordinator acts as a reverse proxy for the target web server  
** bridge the communication between the client browser and Remote Coordinator

### Remote Coordinator
** live outside of the firewall
** accept target web site info from Local Proxy 
** connect to the target web server
** connect back to Local Proxy separately ( may isolate this part as a standalone service for scalability )
** bridge the communication between Local Proxy and target web server. 



## Requirements
* nodejs
* http = require('http')
* net = require('net');
* { URL } = require('url');
* uuid = require('uuid')

## Todo
* Instructment -- or maybe autorestart when memory footprint is too large ? 
* NAT Mapping Service, ping a Lambda Function to keep alive. The function would reply with a pair sourice_ip and port. and notify neigher serivce the most up-to-date source_ip and port  
* encrpyt target web site sent from Local Proxy to Remote Coordinator
* encrypt communication between  Local Proxy and Remote Coordinator for evading firewall inspection
* live test while in firewall
* enhance performance (in terms of speed , responsiveness)
* increase the number of simultaneous connection
* performance testing
* support http2 

