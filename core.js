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

Manager.prototype.connectRoutePubClient = function(route, pubClient){
  var publisher,
      publisherI,
      subClient,
      subClientI,
      subscriber,
      subscriberI;

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
                pubClient.addOutConnection(publisher, 
                                           subClient, 
                                           subscriber, 
                                           route);
                //and connect the publisher to this subscriber
                subClient.addInConnection(pubClient,
                                          publisher,
                                          subscriber,
                                          route);
              }
            }
          }
        }
      }
    }
  }
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
      //subClientI,
      subscriber,
      subscriberI;

  pubClient = client;
      
  //for each route
  for(routeI = this.routes.length - 1; routeI >= 0; routeI--){
    route = this.routes[routeI];
    //establish all connections between this client's publishers and
    // appropriate subscribers
    this.connectRoutePubClient(route, pubClient);

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
            pubClient.addOutConnection(publisher, subClient, subscriber, route);
            //and add the connection the other way...
            subClient.addInConnection(pubClient, publisher, subscriber, route);
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
 * cleans up both sides of this pub/sub connection
 * @param {Object} sourceEndpoint The publisher or subscriber that
 *   the connection is defined in.
 * @param {Object} sourceConnection The connection associated with the
 *   sourceEndpoint that we want to clean up.
 * @throws Throws an error if the connection is not registered with the
 *   provided endpoint.
 */
Manager.breakConnection = function(sourceEndpoint, sourceConnection){
  var destEndpoint,
      destConnection,
      destConnectI,
      sourceConnectI,
      cleanedConn;

  //remove the connection from this endpoint
  cleanedConn = false;
  //for each connection in this endpoint
  for(sourceConnectI = sourceEndpoint.connectedTo.length - 1;
      sourceConnectI >= 0 && !cleanedConn;
      sourceConnectI--){
    if (sourceEndpoint.connectedTo[sourceConnectI] === sourceConnection){
      sourceEndpoint.connectedTo.splice(sourceConnectI, 1);
      cleanedConn = true;
    }
  }
  //if we didn't find the connection in this endpoint
  if (!cleanedConn){
    throw new Error(
      'sourceConnection must be registered with sourceEndpoint');
  }

  //and break the connection from the other side too
  destEndpoint = sourceConnection.endpoint;
  cleanedConn = false;
  //for each connection the other endpoint is involved in
  for(destConnectI = destEndpoint.connectedTo.length - 1;
      destConnectI >= 0 && !cleanedConn;
      destConnectI--){
    destConnection = destEndpoint.connectedTo[destConnectI];
    //if the OTHER other endpoint matches the fromEndpoint
    if (destConnection.endpoint === sourceEndpoint){
      //then remove the connection
      destEndpoint.connectedTo.splice(destConnectI, 1);
      //there should be only one occurance
      cleanedConn = true;
    }
  }
  //if we didn't find the connection in the other endpoint,
  if (!cleanedConn){
    //TODO: log warning?
  }
  /*
   * We don't need to clean up each specifying route
   * since routes don't track connections, just matched publishers
   *  //for each specifying route
   *  for(routeI = fromConnection.routes.length - 1;
   *      routeI >= 0;
   *      routeI--){
   *    route = fromConnection.routes[routeI];
   *    //unregister this connection from this route
   *    // OH! actually connections are not registered with routes
   *  }*/
  sourceConnection.routes = [];
};

/**
 * cleans up both sides of all connections associated with
 *   the provided set of endpoints.
 * @param {Array} fromEndpoints an array of publishers or subscribers
 *   to clean up
 */
Manager.cleanConnectionsFrom = function(fromEndpoints){
  var fromEndpoint,
      fromEndpointI,
      fromConnection,
      fromConnectI;

  //for each endpoint
  for(fromEndpointI = fromEndpoints.length - 1;
      fromEndpointI >= 0;
      fromEndpointI--){
    fromEndpoint = fromEndpoints[fromEndpointI];
    //for each connection this endpoint is involved in
    for(fromConnectI = fromEndpoint.connectedTo.length - 1;
        fromConnectI >= 0;
        fromConnectI--){
      fromConnection = fromEndpoint.connectedTo[fromConnectI];
      //break the connection
      Manager.breakConnection(fromEndpoint, fromConnection);
//      //break the connection from the other side too
//      toEndpoint = fromConnection.endpoint;
//      var cleanedTo = false;
//      //for each connection the other endpoint is involved in
//      for(toConnectI = toEndpoint.connectedTo.length -1;
//          toConnectI >= 0 && !cleanedTo;
//          toConnectI--){
//        toConnection = toEndpoint.connectedTo[toConnectI];
//        //if the OTHER other endpoint matches the fromEndpoint
//        if (toConnection.endpoint === fromEndpoint){
//          //then remove the connection
//          toEndpoint.connectedTo.splice(toConnectI, 1);
//          //there should be only one occurance
//          cleanedTo = true;
//        }
//      }
//      //if we didn't find the connection in the other endpoint,
//      if (!cleanedTo){
//        //TODO: log warning?
//      }
//      /*
//       * We don't need to clean up each specifying route
//       * since routes don't track connections, just matched publishers
//       *  //for each specifying route
//       *  for(routeI = fromConnection.routes.length - 1;
//       *      routeI >= 0;
//       *      routeI--){
//       *    route = fromConnection.routes[routeI];
//       *    //unregister this connection from this route
//       *    // OH! actually connections are not registered with routes
//       *  }*/
//      fromConnection.routes = [];
    }
    fromEndpoint.connectedTo = [];
  }
};

/**
 * Removes the specified client from the server an cleans up
 *   any associated pub/sub connections.
 * @param client {Object|string|Leaf} details about the client.
 *   {name:string, metadata:Object}
 * @returns {boolean} true iff a client was removed.
 */
Manager.prototype.removeClient = function(client){
  var pubClient,
      publisher,
      publisherI,
      subClient,
      route,
      routeI,
      clientI;

  clientI = this.indexOfClient(client);
  
  if (clientI >= 0){
    //Clean up all connections involving this client's subscribers
    subClient = this.clients[clientI];
    Manager.cleanConnectionsFrom(subClient.subscribers);

    //Clean up all connections involving this client's publishers
    pubClient = subClient;
    Manager.cleanConnectionsFrom(pubClient.publishers);

    //Clean up all route associations with this client's publishers
    //for each publisher
    for(publisherI = pubClient.publishers.length - 1;
        publisherI >= 0;
        publisherI--){
      publisher = pubClient.publishers[publisherI];
//      //for each connection this publisher is involved in
//      for(pubConnectI = publisher.connectedTo.length - 1;
//          pubConnectI >= 0;
//          pubConnectI--){
//        pubConnection = publisher.connectedTo[pubConnectI];
//        //break the connection from the subscriber side too
//        subscriber = pubConnection.endpoint;
//        var cleanedSubscriber = false;
//        //for each connection this subscriber is involved in
//        for(subConnectI = subscriber.connectedTo.length -1;
//            subConnectI >= 0 && !cleanedSubscriber;
//            subConnectI--){
//          subConnection = subscriber.connectedTo[subConnectI];
//          //if the endpoint matches this publisher
//          if (subConnection.endpoint === publisher){
//            //then remove the connection
//            subscriber.connectedTo.splice(subConnectI, 1);
//            //there should be only one occurance
//            cleanedSubscriber = true;
//          }
//        }
//        //if we didn't find the connection in the subscriber,
//        if (!cleanedSubscriber){
//          //TODO: log warning?
//        }
//        /*
//         * We don't need to clean up each specifying route
//         * since routes don't track connections, just matched publishers
//         *  //for each specifying route
//         *  for(routeI = pubConnection.routes.length - 1;
//         *      routeI >= 0;
//         *      routeI--){
//         *    route = pubConnection.routes[routeI];
//         *    //unregister this connection from this route
//         *    // OH! actually connections are not registered with routes
//         *  }*/
//        pubConnection.routes = [];
//      }
//      publisher.connectedTo = [];
      //for each route this connection matches
      for(routeI = publisher.routes.length - 1;
          routeI >= 0;
          routeI--){
        route = publisher.routes[routeI];
        //unregister this publisher from this route
        for(var matchedI = route.from.matched.length - 1;
            matchedI >= 0;
            matchedI--){
          var matched = route.from.matched[matchedI];
          if (matched.client.matches(pubClient) &&
              matched.endpoint.name === publisher.name &&
              matched.endpoint.type === publisher.type){
            route.from.matched.splice(matchedI, 1);
            break;
          }
        }
      }
      publisher.routes = [];
    }
    this.clients.splice(clientI, 1);
  }
  return (clientI >= 0);
};

/**
 * Gets an array detailing the clients currently registered with this server.
 * @returns {Array} An array of client info: 
 *   [{name:string, description:string, subscribers:Array, 
 *     publishers:Array, metadata:Object},...]
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
 * Goes through all clients and creates any connections that match
 *   this route.
 * @param {Route} route The route to create connections with
 */
Manager.prototype.connectRoute = function(route){
  var pubClient,
      pubClientI;
  //First we will go through all clients and associate their publishers.
  // Then we will go through all clients and check their subscribers
  // against the associated publishers.
  
  //for each registered client
  for(pubClientI = this.clients.length - 1;
      pubClientI >= 0;
      pubClientI--){
    pubClient = this.clients[pubClientI];
    //connect this client's publishers to all 
    // appropriate registered subscribers
    this.connectRoutePubClient(route, pubClient);
  }
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
    this.connectRoute(route);
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
  var routeI,
      match,
      matchI,
      publisher,
      connection,
      connectionI,
      connectRouteI,
      pubRouteI;

  //get the referenced Route instance from the registered routes
  routeI = this.indexOfRoute(route);
  if (routeI >= 0){
    route = this.routes[routeI];
    //Clean up publisher matches and associated pub/sub connections
    //for each matched publisher
    for(matchI = route.from.matched.length - 1;
        matchI >= 0;
        matchI--){
      match = route.from.matched[matchI];
      publisher = match.endpoint;
      //dis-associate the route from this publisher
      var disassociated = false;
      //for each route associated with this publisher
      for(pubRouteI = publisher.routes.length - 1;
          pubRouteI >= 0 && !disassociated;
          pubRouteI--){
        //if this publisher/route association includes this route
        if (publisher.routes[pubRouteI] === route){
          //remove the association
          publisher.routes.splice(pubRouteI, 1);
          //we should only have one matching association
          disassociated = true;
        }
      }
      //if we didn't find a matching publisher/route association
      if (!disassociated){
        //TODO: log warning?
      }
      //now go through each connection associated with this publisher
      for(connectionI = publisher.connectedTo.length - 1;
          connectionI >= 0;
          connectionI--){
        connection = publisher.connectedTo[connectionI];
        disassociated = false;
        //for each route associated with this connection
        for(connectRouteI = connection.routes.length - 1;
            connectRouteI >= 0 && !disassociated;
            connectRouteI--){
          //if the connection is associated with this route
          if (connection.routes[connectRouteI] === route){
            //remove the association
            connection.routes.splice(connectRouteI, 1);
            //there should only be one association
            disassociated = true;
            //if there are no other associations
            if (connection.routes.length === 0){
              //then we should break the connection
              Manager.breakConnection(publisher, connection);
            }
          }
        }
      }
    }
    this.routes.splice(routeI, 1);
  }
  return (routeI >= 0);
};

/**
 * Gets an array detailing the routes currently registered with this server.
 * @returns {Array} An array of route info: 
 *   [{type:string, style:string, uuid:string, 
 *     from:{name:string, metadata:object, endpoint:string}, 
 *     to:{name:string, metadata:object, endpoint:string}},...]
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
 * Gets an array of specific publisher/subscriber 
 *   connections that currently exist.
 * @returns {Array} an array of pub/sub connection info:
 *   [{type:string, from:{uuid:string, endpoint:string}, 
 *     to:{uuid:string, endpoint:string}, routes:[string,...]}]
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

Manager.prototype.published = function(pubClient, pubName, type, message){
  //get the actual client object from the registered clients
  var pubClientI = this.indexOfClient(pubClient);
  if (pubClientI >= 0){
    pubClient = this.clients[pubClientI];
    var publisher;
    //get the appropriate publisher from this client
    for (var publisherI = pubClient.publishers.length - 1;
         publisherI >= 0 && publisher === undefined;
         publisherI--){
      var currPub = pubClient.publishers[publisherI];
      if (currPub.name === pubName && currPub.type === type){
        publisher = currPub;
      }
    }
    if (publisher !== undefined){
      //for each connected subscriber
      for(var connectionI = publisher.connectedTo.length -1;
          connectionI >= 0;
          connectionI--){
        var connection = publisher.connectedTo[connectionI];
        //forward the message to them
        connection.client.sendCallback(connection.endpoint.name,
                                       connection.endpoint.type,
                                       message);
      }
    }
  }
};

module.exports = Manager;
