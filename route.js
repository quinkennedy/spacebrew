/**
 * Spacebrew Route
 * @module spacebrew/route
 */

var uuid = require('node-uuid');
var Leaf = require('./leaf.js');

/**
 * Creates an instance of a Spacebrew Route
 * @constructor
 * @param {string} style The style of route this is. Options available in Route.style
 * @param {string|RegExp} type The type of data this route will carry ('string', 'boolean', 'range', ...)
 * @param {Object|string} fromId the identifier for the client that is publishing data. If style = 'string' this should be an {name:string, metadata:object} definition that will string match the source client. if style = 'regexp' this should be an {name:RegExp, metadata:object} definition that will regexp match the source client. if style = 'uuid' this should be a UUID string that matches the source client's UUID.
 * @param {string|RegExp} publisherName the particular publisher from the client to route data from. stirng or RegExp depending on the style.
 * @param {Object|string} toId the identifier for the client that is receiving data. If style = 'string' this should be an {name:string, metadata:object} definition that will string match the destination client. if style = 'regexp' this should be an {name:RegExp, metadata:object} definition that will regexp match the destination client. if style = 'uuid' this should be a UUID string that matches the destination client's UUID.
 * @param {string|RegExp} subscriberName the particular subscriber from the client to route data to. stirng or RegExp depending on the style.
 */
var Route = function(style, type, fromId, publisherName, toId, subscriberName){
  if (Route.styles.indexOf(style) === -1){
    throw new Error('style argument must be one of '+Route.styles.join(', '));
  }
  this.style = style;
  //check that fromId/toId are appropriate objects
  if (style === Route.styles.REGEXP ||
      style === Route.styles.STRING){
    var checkId = function(id, argName){
      if (typeof(id) !== 'object'){
        throw new TypeError(argName + ' must be an object');
      }
      if (!(id.hasOwnProperty('name')) ||
          !(id.hasOwnProperty('metadata'))){
        throw new Error(argName + 
                        ' must have both name and metadata properties');
      }
      if (typeof(id.metadata) !== 'object'){
        throw new Error(argName + '.metadata must be an object/map');
      }
    };
    checkId(fromId, 'fromId');
    checkId(toId, 'toId');
  } else {//style == UUID
    var checkUUID = function(id, argName){
      if (typeof(id) !== 'string'){
        throw new TypeError(argName + 
                            ' must be a UUID string because style is ' + 
                            style);
      }
    };
    checkUUID(fromId, 'fromId');
    checkUUID(toId, 'toId');
  }
  if (style === Route.styles.REGEXP){
    if (type instanceof RegExp &&
        fromId.name instanceof RegExp &&
        publisherName instanceof RegExp &&
        toId.name instanceof RegExp &&
        subscriberName instanceof RegExp){
      this.type = type;
      this.from = {name:fromId.name,
                   endpoint:publisherName,
                   metadata:fromId.metadata};
      this.to = {name:toId.name,
                 endpoint:subscriberName,
                 metadata:toId.metadata};
    } else {//type error
      throw new TypeError('type, fromId.name, publisherName, toId.name, and subscriberName must all be RegExp objects when style is ' + style);
    }
  } else if (style === Route.styles.UUID){
    if (typeof(type) === 'string' &&
        typeof(publisherName) === 'string' &&
        typeof(subscriberName) === 'string'){
      this.type = type;
      this.from = {uuid:fromId,
                   endpoint:publisherName};
      this.to = {uuid:toId,
                 endpoint:subscriberName};
    } else {//type error
      throw new TypeError('type, publisherName, and subscriberName must all be strings when style is ' + style);
    }
  } else if (style === Route.styles.STRING){
    if (typeof(type) === 'string' &&
        typeof(fromId.name) === 'string' &&
        typeof(publisherName) === 'string' &&
        typeof(toId.name) === 'string' &&
        typeof(subscriberName) === 'string'){
      this.type = type;
      this.from = {name:fromId.name,
                   endpoint:publisherName,
                   metadata:fromId.metadata};
      this.to = {name:toId.name,
                 endpoint:subscriberName,
                 metadata:toId.metadata};
    } else {//type error
      throw new TypeError('type, fromId.name, publisherName, toId.name, and subscriberName must all be strings when style is ' + style);
    }
  } else {//unrecognized style
    throw new Error('unrecognized style');
  }
  this.uuid = uuid.v1();
};

Route.styles = [];
Route.styles.STRING = 'string';
Route.styles.REGEXP = 'regexp';
Route.styles.UUID = 'uuid';
(function listFromMap(list, map){
  var keys = Object.keys(map);
  for(var i = 0; i < keys.length; i++){
    list.push(map[keys[i]]);
  }
}).call(this, Route.styles, Route.styles);

/**
 * Returns true if the two routes' identifying information matches.
 * @param {Object|string} otherRoute The route to compare against.
 *   can either be a Route object,
 *   a map {type:string, from:{name:string, endpoint:string, metadata:object}, to:{name:string, endpoint:string, metadata:object}},
 *   or a uuid.
 * @return {boolean} true if the clients' names and all metadata match
 */
Route.prototype.matches = function(otherRoute){
  var match = true;
  if (typeof(otherRoute) == 'string'){
    var otherUuid = otherRoute;
    match = match && (this.uuid === otherUuid);
  } else {
    match = match && (this.style === otherRoute.style);
    var isequal = function(a, b){
      if (this.style === Route.styles.REGEXP){
        return (a.toString() === b.toString());
      } else {
        return (a === b);
      }
    };
    match = match && isequal(this.type, otherRoute.type);
    match = match && isequal(this.from.endpoint, otherRoute.from.endpoint);
    match = match && isequal(this.to.endpoint, otherRoute.to.endpoint);
    if (this.style === Route.styles.UUID){
      match = match && (this.from.uuid === this.from.uuid);
      match = match && (this.to.uuid === this.to.uuid);
    } else {
      match = match && isequal(this.from.name, otherRoute.from.name);
      match = match && isequal(this.to.name, otherRoute.to.name);
      match = match && Leaf.metadataMatch(this.from.metadata, otherRoute.from.metadata);
      match = match && Leaf.metadataMatch(this.to.metadata, otherRoute.to.metadata);
    }
  }
  return match && true;
};

/**
 * returns a simple map of this routes data
 * @returns {Object} {type:string, style:string, uuid:string, from:{name:string, metadata:object, endpoint:string, uuid:string}, to:{name:string, metadata:object, endpoint:string, uuid:string}}
 */
Route.prototype.toMap = function(){
  var out = {type:this.type,
             style:this.style,
             uuid:this.uuid,
          from:{endpoint:this.from.endpoint},
          to:{endpoint:this.to.endpoint}};
  if (this.style === Route.styles.UUID){
    out.from.uuid = this.from.uuid;
    out.to.uuid = this.to.uuid;
  } else {
    out.from.name = this.from.name;
    out.from.metadata = this.from.metadata;
    out.to.name = this.to.name;
    out.to.metadata = this.to.metadata;
  }
  return out;
};

module.exports = Route;
