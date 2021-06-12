## Milestone Features:
* able to watch youtube via this proxy
* able to check gmail 
* log request 
* each service component can run independently (loose coupling).
* able to work behind a NAT infrastructure

## Environment Issues
* need to enable IPv6 on your operating systems (on all hosts running this software) because it is getting more and more prevalent now (google is a good help)

## Dependencies
* node.js v16.0.0
* npm install uuid@8.3.2
* npm install axios@0.21.1

## Technial Specification 
**Client Web Browser** <=> **Local Proxy** <=> **Firewall** <=> **Remote Coordinator** <=> **Target Web Server**

### Local Proxy 
* live behind a firewall, run on a personal computer
* act as a ordinary http proxy for a ordinary client web browser like Firefox. 
* contains startup workflow and normal workflow

#### Startup Workflow (when the program starts up) 
* ask IP:Port Reporting Service for public facing IP and port and open a NAT tunnel, and record the local port used in this request. (Google NAT Transveral for more information)
* create a serivce (Tunnel Creation Service) that listened on the previously recorded local port. This service build communication tunnels between the web browser and the target web site.
* when the Tunnel Creation Service is created, start a timer (configurable). Whenever this service receives a packet, renew this timer. On timeout, close the service and restart this workflow. 

#### Normal Workflow (when the client browser sends a request)
* on every request (connection) from the web browser, create a session id, and record it and the socket of this connection on a lookup table. 
* send target web site info, the public facing IP:Port, and the session id to the Remote Coordinator 
* have Tunnel Creation Service to wait for a seperation connection from the Remote Coordinator. Now the Remote Coordinator acts as a reverse proxy for the target web server. When connected, the Remote Coordinator first sends a session id to identify the corresponding browser socket, and the rest is data from the target web server. After getting session id, the Tunnel Creation Service connect the socket of this connection to that of the corresponing web browser connection. Pipe them together, and now we have a tunnel to handle to a single browers-website request. 


### Remote Coordinator
* live outside of the firewall
* accept target web site info from Local Proxy 
* connect to the target web server
* connect back to Local Proxy separately ( may isolate this part as a standalone service for scalability )
* bridge the communication between Local Proxy and target web server. (Build a tunneling) 

### IP:Port Reporting Service
* Local Proxy accesses this service to get its current public facing IP and port and open a NAT trasveral tunnel  
* This IP:Port frequently send packets to Local Proxy to keep NAT table record alive. If it hears no reply from Local Proxy, stop sending packets. 



## Todo
* package.json - auto install 
* Instrument -- or maybe autorestart when memory footprint is too big ? 
* encrpyt target web site sent from Local Proxy to Remote Coordinator
* encrypt communication between  Local Proxy and Remote Coordinator for evading firewall inspection
* live test while in firewall
* performance testing
* fix TODO 
* proxy server timeout
* heartbeat for systems

