/**
 * Spacebrew Manager
 * @module spacebrew/manager
 */

var Leaf = require('./leaf.js');
var Route = require('./route.js');

/**
 * Creates an instance of a Spacebrew Manager
 * @constructor
 */
var Manager = function(){
  /** the clients registered with this network */
  this.clients = [];
  /** the routes configured on this network */
  this.routes = [];
  /** the admins registered with this network */
  this.admins = [];
  /** the other managers in this network */
  this.managers = [];
};
  
/**
 * Adds a client (leaf node) to the server
 * @param client {Leaf} The client object to add. 
 * @returns {boolean} true iff the provided client is added. 
 *   The client will not be added if it matches a client already registered.
 * @throws Error if argument is not a Leaf instance
 */
Manager.prototype.addClient = function(client){
  //make sure the client is the proper type
  if (!(client instanceof Leaf)){
    throw new TypeError('argument must be a Leaf instance');
  }
  //make sure there is not a duplicate client already registered
  var clientUnique = (this.indexOfClient(client) === -1);
  if (clientUnique){
    //connect this client's publishers and subscribers
    // to other endpoints based on the currently defined routes
    this.connectClient(client);

    //add the client to the current list of clients
    this.clients.push(client);
  }
  return clientUnique;
};

/**
 * Goes through the current list of routes and connects 
 *   this client's endpoints to other endpoints based on 
 *   the currently defined routes.
 * @param {Leaf} client the client to connect
 */
Manager.prototype.connectClient = function(client){
  var pubClient,
      //pubClientI,
      publisher,
      publisherI,
      route,
      routeI,
      subClient,
      subClientI,
      subscriber,
      subscriberI;

  pubClient = client;
      
  //for each route
  for(routeI = this.routes.length - 1; routeI >= 0; routeI--){
    route = this.routes[routeI];
    //if this client matches the route's "from" client
    if(route.matchesFromClient(pubClient)){
      //go through each publisher on this client
      for(publisherI = pubClient.publishers.length - 1; 
          publisherI >= 0; 
          publisherI--){
        publisher = pubClient.publishers[publisherI]; 
        //if this publisher matches the route's "from" endpoint
        if(route.matchesPublisher(pubClient, publisher)){
          //then associate this publisher with this route
          publisher.routes.push(route);
          route.from.matched.push({client:pubClient,
                                   endpoint:publisher});
          //TODO
          //now because we want to handle pattern-matching with
          // back-referencing from subscribers 
          // to captured patterns in publishers
          // we have to go through all subscribers in-context.

          //so for each registered client
          for(subClientI = this.clients.length - 1; 
              subClientI >= 0;
              subClientI--){
            subClient = this.clients[subClientI];
            //if this client matches the route's "to" client
            if(route.matchesPubToClient(pubClient, publisher, subClient)){
              //for each subscriber in that client
              for(subscriberI = subClient.subscribers.length - 1;
                  subscriberI >= 0;
                  subscriberI--){
                subscriber = subClient.subscribers[subscriberI];
                //see if the subscriber matches this route/publisher combo
                if(route.matchesPair(pubClient, publisher, 
                                     subClient, subscriber)){
                  //and connect the subscriber to this publisher
                  pubClient.addConnection(publisher, subClient, subscriber, route);
                }
              }
            }
          }
        }
      }
    }
    //now check if this client's subscribers match this route
    subClient = client;
    
    //for each publisher that matches this route
    for(publisherI = route.from.matched.length - 1;
        publisherI >= 0;
        publisherI--){
      pubClient = route.from.matched[publisherI].client;
      publisher = route.from.matched[publisherI].endpoint;
      //if this client matches the route's "to"
      if(route.matchesPubToClient(pubClient, publisher, subClient)){
        //for each subscriber in this client
        for(subscriberI = subClient.subscribers.length - 1;
            subscriberI >= 0;
            subscriberI--){
          subscriber = subClient.subscribers[subscriberI];
          //if this subscriber matches the route/publisher combo
          if(route.matchesPair(pubClient, publisher,
                               subClient, subscriber)){
            //connect the subscriber to this publisher
            pubClient.addConnection(publisher, subClient, subscriber, route);
          }
        }
      }
    }
  }
};

/**
 * Gets the index of the first client that matches the provided client.
 * @param client {Object|string|Leaf} the client data to match against
 * @return {number} The index of the first client in the router's
 *   client list that matches (name and all metadata info)
 *   the provided client. Returns -1 if no match is found.
 */
Manager.prototype.indexOfClient = function(client){
  for(var i = 0; i < this.clients.length; i++){
    if (this.clients[i].matches(client)){
      return i;
    }
  }
  return -1;
};

/**
 * Removes the specified client from the server
 * @param client {Object|string|Leaf} details about the client.
 *   {name:string, metadata:Object}
 * @returns {boolean} true iff a client was removed.
 */
Manager.prototype.removeClient = function(client){
  var i = this.indexOfClient(client);
  if (i >= 0){
    this.clients.splice(i, 1);
  }
  return (i >= 0);
};

/**
 * Gets an array detailing the clients currently registered with this server.
 * @returns {Array} An array of client info: 
 *   [{name:string, description:string, subscribers:Array, publishers:Array, metadata:Object},...]
 */
Manager.prototype.getClients = function(){
  var clients = [];
  for(var i = 0; i < this.clients.length; i++){
    var curr = this.clients[i];
    clients.push(curr.toMap());
  }
  return clients;
};

/**
 * Gets the index of the first route that matches the provided route.
 * @param route {Object|string|Route} the route data to match against
 * @return {number} The index of the first route in the router's
 *   route list that matches the provided route. 
 *   Returns -1 if no match is found.
 */
Manager.prototype.indexOfRoute = function(route){
  for(var i = 0; i < this.routes.length; i++){
    if (this.routes[i].matches(route)){
      return i;
    }
  }
  return -1;
};

/**
 * Adds a route to the server
 * @param route {Route} The route object to add. 
 * @returns {boolean} true iff the provided route is added. 
 *   The route will not be added if it matches a route already registered.
 * @throws Error if argument is not a Route instance
 */
Manager.prototype.addRoute = function(route){
  if (!(route instanceof Route)){
    throw new TypeError('argument must be a Route instance');
  }
  var routeUnique = (this.indexOfRoute(route) === -1);
  if (routeUnique){
    this.routes.push(route);
  }
  return routeUnique;
};

/**
 * Removes the specified route from the server
 * @param route {Object|string|Route} details about the route.
 * @returns {boolean} true iff a route was removed.
 */
Manager.prototype.removeRoute = function(route){
  var i = this.indexOfRoute(route);
  if (i >= 0){
    this.routes.splice(i, 1);
  }
  return (i >= 0);
};

/**
 * Gets an array detailing the routes currently registered with this server.
 * @returns {Array} An array of route info: 
 *   [{type:string, style:string, uuid:string, from:{name:string, metadata:object, endpoint:string}, to:{name:string, metadata:object, endpoint:string}},...]
 */
Manager.prototype.getRoutes = function(){
  var routes = [];
  for(var i = 0; i < this.routes.length; i++){
    var curr = this.routes[i];
    routes.push(curr.toMap());
  }
  return routes;
};

/**
 * Gets an array of specific publisher/subscriber connections that currently exist.
 * @returns {Array} an array of pub/sub connection info:
 *   [{type:string, from:{uuid:string, endpoint:string}, to:{uuid:string, endpoint:string}, routes:[string,...]}]
 */
Manager.prototype.getConnections = function(){
  var connections = [];
  //the connections are stored as references from each publisher to subscriber
  
  //for each client
  for(var pubClientI = this.clients.length - 1;
      pubClientI >= 0;
      pubClientI--){
    var pubClient = this.clients[pubClientI];
    //get all the connections coming from that client
    var clientConnections = pubClient.getOutgoingConnections();
    //and add them to the list
    connections = connections.concat(clientConnections);
  }

  return connections;
};

module.exports = Manager;
