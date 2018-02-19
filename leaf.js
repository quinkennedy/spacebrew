/**
 * Spacebrew leaf (aka Client) class
 * @module spacebrew/leaf
 */

var uuid = require('uuid');

/**
 * Creates an instance of a Spacebrew Leaf
 * @constructor
 * @param {string} name user-friendly name of this Leaf node
 * @param {Array} subscribers expected format [{name:string, type:string},...]
 * @param {Array} publishers expected format 
 *   [{name:string, type:string, default:],...]
 * @param {function} sendCallback function that will be called 
 *   when a message is being sent to this Client
 * @param {string} description human-readable description
 * @param {Object} metadata free-form-ish metadata map
 */
var Leaf = function(name, 
                    subscribers, 
                    publishers, 
                    sendCallback, 
                    description, 
                    metadata){
  
  /** the string name of this client */
  this.name = name = '' + name;
  /** the list of subscribers this client exposes */
  this.subscribers = Leaf.cleanSubscribers(subscribers);
  /** the list of publishers this client exposes */
  this.publishers = Leaf.cleanPublishers(publishers);
  /** the function that will be called when a message is going to this client */
  this.sendCallback = Leaf.verifyFunction(sendCallback); 
  /** the human-readable string description for this client */
  this.description = '' + description;
  /** time-based uuid for identifying this leaf */
  this.uuid = uuid.v1();
  /** 
   * extra identifying information for this client.
   *   Used for uniquely identifying this client.
   *   Usually contains information like IP address, connectionID, etc.
   */
  this.metadata = Leaf.cleanMetadata(metadata);


};

/**
 * Returns true if the provided client matches this client.
 * @param {Object|string} otherClient Client to compare against.
 *   Can either be another Client object, 
 *   an object describing name/metadata: {name:string, metadata:object}, 
 *   or a uuid
 * @return {boolean} true if the clients' names and all metadata match
 */
Leaf.prototype.matches = function(otherClient){
  var match = true;
  if (typeof(otherClient) == 'string'){
    var otherUuid = otherClient;
    match = match && (this.uuid === otherUuid);
  } else {
    match = match && (this.name === otherClient.name);
    match = match && Leaf.metadataMatch(this.metadata, otherClient.metadata);
  }
  return match;
};

/**
 * Gets this leaf's data as a simple map
 * @returns {Object} {name:string, description:string, 
 *   subscribers:Array, publishers:Array, metadata:Object}
 */
Leaf.prototype.toMap = function(){
  var map = {name:this.name,
             description:this.description,
             subscribers:[],
             publishers:[],
             metadata:this.metadata,
             uuid:this.uuid};
  for (var pubI = 0; pubI < this.publishers.length; pubI++){
    var pub = this.publishers[pubI];
    map.publishers.push({name:pub.name,
                         type:pub.type,
                         default:pub.default});
  }
  for (var subI = 0; subI < this.subscribers.length; subI++){
    var sub = this.subscribers[subI];
    map.subscribers.push({name:sub.name,
                          type:sub.type});
  }
  return map;
};

/**
 * adds the specified connection to the provided publisher
 *   This method ensures that duplicate connections are not defined.
 * @param {object} publisher The publisher endpoint of the connection.
 *   This must be a publisher registered in this client.
 * @param {Leaf} subClient The client that contains the subscriber endpoint
 *   of this connection.
 * @param {object} subscriber The subscriber endpoint of the connection.
 *   Must be a subscriber registered in the subClient.
 * @param {Route} route The route that matches this connection.
 */
Leaf.prototype.addOutConnection = function(publisher, 
                                           subClient, 
                                           subscriber, 
                                           route){
  var added = false;
  //go through all connections registered with the specified publisher.
  var connectionI = publisher.connectedTo.length - 1;
  for(; connectionI >= 0 && !added; connectionI--){
    var connection = publisher.connectedTo[connectionI];
    //if there are any copies, add the route to that existing connection.
    if (connection.client === subClient &&
        connection.endpoint === subscriber){
      connection.routes.push(route);
      added = true;
    }
  }

  //otherwise, create a new connection.
  if(!added){
    publisher.connectedTo.push({client:subClient,
                                endpoint:subscriber,
                                routes:[route]});
  }
};

/**
 * adds the specified connection to the provided subscriber
 *   This method ensures that duplicate connections are not defined.
 * @param {Leaf} pubClient The client that contains the publisher endpoint
 *   of this connection.
 * @param {object} publisher The publisher endpoint of the connection.
 *   This must be a publisher registered in the pubClient.
 * @param {object} subscriber The subscriber endpoint of the connection.
 *   Must be a subscriber registered in this Client.
 * @param {Route} route The route that matches this connection.
 */
Leaf.prototype.addInConnection = function(pubClient,
                                          publisher, 
                                          subscriber, 
                                          route){
  var added = false;
  //go through all connections registered with the specified subscriber.
  var connectionI = subscriber.connectedTo.length - 1;
  for(; connectionI >= 0 && !added; connectionI--){
    var connection = subscriber.connectedTo[connectionI];
    //if there are any copies, add the route to that existing connection.
    if (connection.client === pubClient &&
        connection.endpoint === publisher){
      connection.routes.push(route);
      added = true;
    }
  }

  //otherwise, create a new connection.
  if(!added){
    subscriber.connectedTo.push({client:pubClient,
                                 endpoint:publisher,
                                 routes:[route]});
  }
};

/**
 * Returns an array of connection definitions specifying which 
 *  of this client's publishers are connected to which subscribers.
 * @return {Array} [{type:string, from:{uuid:string, endpoint:string}, 
 *   to:{uuid:string, endpoint:string}, routes:[string,...]},...]
 */
Leaf.prototype.getOutgoingConnections = function(){
  var pubClient = this;
  var connections = [];

  //for each publisher of this client
  var publisherI = this.publishers.length - 1;
  for(; publisherI >= 0; publisherI--){
    var publisher = this.publishers[publisherI];
    //for each connection from this publisher
    var connectionI = publisher.connectedTo.length - 1;
    for(; connectionI >= 0; connectionI--){
      var connectedTo = publisher.connectedTo[connectionI];
      //construct a connection map
      var connection = {type:publisher.type,
                        from:{uuid:pubClient.uuid,
                              endpoint:publisher.name},
                        to:{uuid:connectedTo.client.uuid,
                            endpoint:connectedTo.endpoint.name},
                        routes:[]};
      //add all linked routes
      var routeI = connectedTo.routes.length - 1;
      for(; routeI >= 0; routeI--){
        var route = connectedTo.routes[routeI];
        connection.routes.push(route.uuid);
      }
      connections.push(connection);
    }
  }
  return connections;
};

/**
 * Returns an array of connection definitions which involve this client.
 * @return {Array} [{type:string, from:{uuid:string, endpoint:string}, 
 *   to:{uuid:string, endpoint:string}, routes:[string,...]},...]
 */
Leaf.prototype.getConnections = function(){
  var subClient = this;
  //start by grabbing all the connections from this client's publishers
  var connections = this.getOutgoingConnections();

  //for each subscriber of this client
  var subscriberI = this.subscribers.length - 1;
  for(; subscriberI >= 0; subscriberI--){
    var subscriber = this.subscribers[subscriberI];
    //for each connection to this subscriber
    var connectionI = subscriber.connectedTo.length - 1;
    for(; connectionI >= 0; connectionI--){
      var connectedTo = subscriber.connectedTo[connectionI];
      //as long as the connection doesn't come back to this client
      if (connectedTo.client !== this){
        //construct a connection map
        var connection = {type:subscriber.type,
                          from:{uuid:connectedTo.client.uuid,
                                endpoint:connectedTo.endpoint.name},
                          to:{uuid:subClient.uuid,
                              endpoint:subscriber.name},
                          routes:[]};
        //add all linked routes
        var routeI = connectedTo.routes.length - 1;
        for(; routeI >= 0; routeI--){
          var route = connectedTo.routes[routeI];
          connection.routes.push(route.uuid);
        }
        connections.push(connection);
      }
    }
  }
  return connections;
};

/**
 * Standardizes a subscriber list to ensure that it contains
 *   only the necessary data
 * @param {Array} subscriberList An array that contains subscriber information. 
 *   Ideally this is in the same format as will be returned by this function.
 * @return {Array} the cleaned-up list of subscribers. 
 *   Any malformed subscribers are excluded. 
 *   [{name:string, type:string, client:this},...]
 */
Leaf.cleanSubscribers = function(subscriberList){
  var subs = [];
  if (Array.isArray(subscriberList)){
    var subscriberI = 0;
    for(; subscriberI < subscriberList.length; subscriberI++){
      var subscriber = subscriberList[subscriberI];
      subs.push({name:'' + subscriber.name, 
                 type:'' + subscriber.type,
                 connectedTo:[]});
    }
  }
  return subs;
};

/**
 * Creates a publisher list with the appropriate format
 * @param {Array} publisherList An array that contains publisher information.
 *   Ideally in this format [{name:string, type:string, default:},...]
 * @return {Array} An appropriately-initialized list of publishers.
 */
Leaf.cleanPublishers = function(publisherList){
  var pubs = [];
  if (Array.isArray(publisherList)){
    for(var i = 0; i < publisherList.length; i++){
      var curr = publisherList[i];
      pubs.push({name:'' + curr.name, 
                 type:'' + curr.type, 
                 default:'' + curr.default,
                 connectedTo:[],
                 routes:[]});
    }
  }
  return pubs;
};

/**
 * Verifies that the function provided is actually a function
 * @param {function} func The function to test
 * @return {function} The supplied function, if it passes validation.
 * @throws Throws an error if the supplied argument is not a function
 */
Leaf.verifyFunction = function(func){
  if (typeof(func) !== 'function'){
    throw new Error('callback must be a function');
  }
  return func;
};

/**
 * cleans up the metadata to conform to single-level expectation
 * @param {Object} metadata The metadata object to sanitize.
 *   Ideally this object only contains values that are numbers or strings.
 * @return {Object} the passed in metadata object with all functions,
 *   objects, arrays, etc. removed. {key:string|number,...}
 */
Leaf.cleanMetadata = function(metadata){
  var cleaned = {};
  if (metadata === null || 
      typeof(metadata) !== 'object' ||
      Array.isArray(metadata)){
    return cleaned;
  }
  var keys = Object.keys(metadata);
  for(var i = 0; i < keys.length; i++){
    var key = keys[i];
    var type = typeof(metadata[key]);
    if (type === 'number' || type === 'string'){
      cleaned[key] = metadata[key];
    }
  }
  return cleaned;
};

/**
 * Returns true if both metadata objects 
 *   have the same keys and associated values
 * @param {Object} mA A metadata object to compare against
 * @param {Object} mB A metadata object to compare against
 * @return {boolean} true if both metadata objects have 
 *   all the same keys and associated values
 */
Leaf.metadataMatch = function(mA, mB){
  var keysA = Object.keys(mA);
  var keysB = Object.keys(mB);
  var match = (keysA.length === keysB.length);
  for(var i = 0; match && i < keysA.length; i++){
    var key = keysA[i];
    match = match && (mA[key] === mB[key]);
  }
  return match;
};

module.exports = Leaf;
