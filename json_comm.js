var Client = require('./leaf.js');
var Route = require('./route.js');
var Admin = require('./admin.js');

/**
 *
 */
var JsonComm = function(spacebrewManager, clientCallback, adminCallback){
  if (typeof(spacebrewManager) !== 'object'){
    throw new TypeError('spacebrewManager is required');
  }
  this.spacebrewManager = spacebrewManager;
  this.clientCallback = clientCallback;
  this.adminCallback = adminCallback;
};

JsonComm.prototype.handleMessage = function(message, metadata, handle){
  if (message.config){
    this.handleConfigMessage(message, metadata, handle);
  } else if (message.message){
    this.handlePublishedMessage(message, metadata, handle);
  } else if (message.admin){
    this.handleAdminMessage(message, metadata, handle);
  } else if (message.route){
    this.handleRouteMessage(message, metadata, handle);
  }
};

JsonComm.prototype.handleConfigMessage = function(message, metadata, handle){
  var self = this;
  var client = new Client(message.config.name,
                          message.config.subscribe.messages,
                          message.config.publish.messages,
                          function(endpoint, type, message){
                            self.clientCallback(
                              {message:
                                {name:endpoint,
                                 type:type,
                                 value:message,
                                 clientName:message.config.name}}, 
                              handle);},
                          message.config.description,
                          metadata);
  this.spacebrewManager.addClient(client);
};

JsonComm.prototype.handlePublishedMessage = function(message, 
                                                     metadata/*, 
                                                     handle*/){
  this.spacebrewManager.published({name:message.message.clientName,
                                   metadata:metadata},
                                  message.message.name,
                                  message.message.type,
                                  message.message.value);
};

JsonComm.prototype.handleAdminMessage = function(message, metadata, handle){
  var self = this;
  delete message.admin;
  var admin = 
    new Admin(
      function(type, data){
        var adminMsg;
        if (type === Admin.messageTypes.ADD){
          adminMsg = [];
          //add all client configs
          for(var clientI = data.clients.length - 1;
              clientI >= 0;
              clientI--){
            var client = data.clients[clientI];
            adminMsg.push(
              {config:{name:client.name,
                       description:client.description,
                       publish:{messages:client.publishers},
                       subscribe:{messages:client.subscribers},
                       options:{},
                       remoteAddress:client.metadata.ip}});
          }
          //add all routes
          for(var connectionI = data.connections.length - 1;
              connectionI >= 0;
              connectionI--){
            var connection = data.connections[connectionI];
            var pubClient = this.spacebrewManager.clients[
                              this.spacebrewManager.indexOfClient(
                                connection.from.uuid)];
            var subClient = this.spacebrewManager.clients[
                              this.spacebrewManager.indexOfClient(
                                connection.to.uuid)];
            adminMsg.push(
              {route:{type:'add',
                      publisher:{clientName:pubClient.name,
                                 name:connection.from.endpoint,
                                 type:connection.type,
                                 remoteAddress:pubClient.metadata.ip},
                      subscriber:{clientName:subClient.name,
                                  name:connection.to.endpoint,
                                  type:connection.type,
                                  remoteAddress:subClient.metadata.ip}}});
          }
        }
        self.adminCallback(adminMsg, handle);},
      message);
  this.spacebrewManager.addAdmin(admin);
};

JsonComm.prototype.handleRouteMessage = function(message/*, metadata, handle*/){
  var pub = message.route.publisher,
      sub = message.route.subscriber;
  if (pub.type === sub.type){
    var route = new Route(Route.styles.STRING,
                          pub.type,
                          {name:pub.clientName,
                           metadata:{ip:pub.remoteAddress}},
                          pub.name,
                          {name:sub.clientName,
                           metadata:{ip:sub.remoteAddress}},
                          sub.name);
    this.spacebrewManager.addRoute(route);
  }
};

module.exports = JsonComm;
