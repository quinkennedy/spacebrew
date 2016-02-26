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
  if (!(client instanceof Leaf)){
    throw new TypeError('argument must be a Leaf instance');
  }
  var clientUnique = (this.indexOfClient(client) === -1);
  if (clientUnique){
    this.clients.push(client);
  }
  return clientUnique;
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

module.exports = Manager;
