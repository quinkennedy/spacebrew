var Spacebrew = require('./core.js');
var WebSocketServer = require('./websocket_server.js');

var Servers = function(){
  this.manager = new Spacebrew();
};

Servers.prototype.startWebsocket = function(){
  this.websocketServer = 
    new WebSocketServer(this.manager,
                        {port:9000, host:'0.0.0.0'},
                        this.logger);
};

module.exports = Servers;
