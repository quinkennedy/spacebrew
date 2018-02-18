/**
 * Spacebrew utility for handling translation between JSON messages and 
 *   Spacebrew API.
 * @module spacebrew/json_comm
 */

var Client = require('./leaf.js');
var Route = require('./route.js');
var Admin = require('./admin.js');
var Validator = require('ajv');
var Schema = require('./schema.json');

/**
 * Creates an instance of the JSON -> API translator.
 * @constructor
 * @param {spacebrew/manager} spacebrewManager The Spacebrew Manager to
 *   execute API requests against
 * @param {function} clientCallback A callback to use when messages need to be
 *   sent to clients
 * @param {function} adminCallback A callback to use when messages need to be
 *   sent to admins
 * @param {Logger} logger an object to use for logging 
 *   (debug, warn, error, etc.)
 */
var JsonComm = function(spacebrewManager, 
                        clientCallback, 
                        adminCallback, 
                        logger){
  if (typeof(spacebrewManager) !== 'object'){
    throw new TypeError('spacebrewManager is required');
  }
  this.spacebrewManager = spacebrewManager;
  this.clientCallback = clientCallback;
  this.adminCallback = adminCallback;
  this.validator = Validator().compile(Schema);
  this.logger = logger;

  // setup logging aliases
  if (this.logger !== undefined){
    this.error = logger.error;
    this.warn = logger.warn;
    this.info = logger.info;
    this.trace = logger.trace;
  } else {
    this.error = function(){
      throw new Error(arguments);
    };
    this.warn = this.info = this.trace = function(){};
  }
};

JsonComm.prototype.handleMessage = function(message, metadata, handle){
  if (!this.validator(message)){
    this.warn(
      '[JsonComm::handleMessage] message did not pass JSON validation');
    for (var errorI = 0; errorI < this.validator.errors.length; errorI++){
      this.info('[JsonComm::handleMessage] err ' + errorI + ': ' +
                this.validator.errors[errorI].message);
    }
  } else {
    if (message.config){
      return this.handleConfigMessage(message, metadata, handle);
    } else if (message.message){
      this.handlePublishedMessage(message, metadata, handle);
    } else if (message.admin){
      return this.handleAdminMessage(message, metadata, handle);
    } else if (message.route){
      return this.handleRouteMessage(message, metadata, handle);
    }
  }
};

JsonComm.prototype.handleConfigMessage = function(message, metadata, handle){
  var self = this;
  var config = message.config;
  var client = new Client(message.config.name,
                          message.config.subscribe.messages,
                          message.config.publish.messages,
                          function(endpoint, type, message){
                            self.clientCallback(
                              {message:
                                {name:endpoint,
                                 type:type,
                                 value:message,
                                 clientName:config.name}}, 
                              handle);},
                          message.config.description,
                          metadata);
  this.spacebrewManager.addClient(client);
  return client;
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
        if (type === Admin.messageTypes.ADD ||
            type === Admin.messageTypes.REMOVE){
          adminMsg = [];
          //add all client configs
          var clientI = data.clients.length - 1;
          for(; clientI >= 0; clientI--){
            var client = data.clients[clientI];
            if (type === Admin.messageTypes.ADD){
              adminMsg.push(
                {config:{name:client.name,
                         description:client.description,
                         publish:{messages:client.publishers},
                         subscribe:{messages:client.subscribers},
                         options:{},
                         remoteAddress:client.metadata.ip}});
            } else if (type === Admin.messageTypes.REMOVE){
              adminMsg.push({remove:[{name:client.name,
                                      remoteAddress:client.metadata.ip}],
                             targetType:'admin'});
            }
          }
          //add all routes
          var connectionI = data.connections.length - 1;
          for(; connectionI >= 0; connectionI--){
            var connection = data.connections[connectionI];
            var getClientFrom = function(uuid, clients){
              var clientI = clients.length - 1;
              for(; clientI >= 0; clientI--){
                var client = clients[clientI];
                if (client.uuid === uuid){
                  return client;
                }
              }
            };
            var pubClient = 
              self.spacebrewManager.clients[
                self.spacebrewManager.indexOfClient(
                  connection.from.uuid)];
            var subClient = 
              self.spacebrewManager.clients[
                self.spacebrewManager.indexOfClient(
                  connection.to.uuid)];
            if (pubClient === undefined){
              pubClient = getClientFrom(connection.from.uuid, data.clients);
            }
            if (subClient === undefined){
              subClient = getClientFrom(connection.to.uuid, data.clients);
            }
            adminMsg.push(
              {route:{type:type,
                      publisher:{clientName:pubClient.name,
                                 name:connection.from.endpoint,
                                 type:connection.type,
                                 remoteAddress:pubClient.metadata.ip},
                      subscriber:{clientName:subClient.name,
                                  name:connection.to.endpoint,
                                  type:connection.type,
                                  remoteAddress:subClient.metadata.ip}}});
          }
        } else if (type === Admin.messageTypes.PUBLISHED){
          adminMsg = {message:{clientName:data.client.name,
                               name:data.publisher.name,
                               type:data.publisher.type,
                               remoteAddress:data.client.metadata.ip},
                      targetType:'admin'};
          if (data.message !== undefined){
            adminMsg.message.value = data.message;
          }
        }
        self.adminCallback(adminMsg, handle);},
      message);
  this.spacebrewManager.addAdmin(admin);
  return admin;
};

JsonComm.prototype.handleRouteMessage = function(message/*, metadata, handle*/){
  var pub = message.route.publisher,
      sub = message.route.subscriber;
  if (pub.type === sub.type){
    if (message.route.type === Admin.messageTypes.REMOVE){
      var routeMap = {type:pub.type,
                      style:Route.styles.STRING,
                      from:{endpoint:pub.name,
                            name:pub.clientName,
                            metadata:{ip:pub.remoteAddress}},
                      to:{endpoint:sub.name,
                          name:sub.clientName,
                          metadata:{ip:sub.remoteAddress}}};
      this.spacebrewManager.removeRoute(routeMap);
    } else if (message.route.type === Admin.messageTypes.ADD){
      var route = new Route(Route.styles.STRING,
                            pub.type,
                            {name:pub.clientName,
                             metadata:{ip:pub.remoteAddress}},
                            pub.name,
                            {name:sub.clientName,
                             metadata:{ip:sub.remoteAddress}},
                            sub.name);
      this.spacebrewManager.addRoute(route);
      return route;
    }
  }
};

module.exports = JsonComm;
