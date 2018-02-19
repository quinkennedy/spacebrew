/**
 * Spacebrew Route
 * @module spacebrew/route
 */

var uuid = require('uuid');
var Leaf = require('./leaf.js');

/**
 * Creates an instance of a Spacebrew Route
 * @constructor
 * @param {string} style The style of route this is. 
 *   Options available in Route.style
 * @param {string|RegExp} type The type of data this route will 
 *   carry ('string', 'boolean', 'range', ...)
 * @param {Object|string} fromId the identifier for the client that is 
 *   publishing data. 
 *   If style = 'string' this should be an {name:string, metadata:object} 
 *     definition that will string match the source client. 
 *   if style = 'regexp' this should be an {name:RegExp, metadata:Array} 
 *     definition that will regexp match the source client. 
 *   if style = 'uuid' this should be a UUID string that matches the 
 *     source client's UUID.
 * @param {string|RegExp} publisherName the particular publisher from 
 *   the client to route data from. stirng or RegExp depending on the style.
 * @param {Object|string} toId the identifier for the client that is 
 *   receiving data. 
 *   If style = 'string' this should be an {name:string, metadata:object} 
 *     definition that will string match the destination client. 
 *   if style = 'regexp' this should be an {name:RegExp, metadata:Array} 
 *     definition that will regexp match the destination client. 
 *   if style = 'uuid' this should be a UUID string that matches the 
 *     destination client's UUID.
 * @param {string|RegExp} subscriberName the particular subscriber from the 
 *   client to route data to. stirng or RegExp depending on the style.
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
      if (style === Route.styles.STRING){
        if (typeof(id.metadata) !== 'object'){
          throw new Error(argName + 
                          '.metadata must be an object/map when style is ' + 
                          style);
        }
      } else if (!(id.metadata instanceof Array)){
        throw new Error(argName + 
                        '.metadata must be an Array when style is ' + 
                        style);
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
      throw new TypeError('type, fromId.name, publisherName, toId.name, and ' +
                          'subscriberName must all be RegExp objects when ' +
                          'style is ' + 
                          style);
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
      throw new TypeError('type, publisherName, and subscriberName must all ' +
                          'be strings when style is ' + 
                          style);
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
      throw new TypeError('type, fromId.name, publisherName, toId.name, and ' +
                          'subscriberName must all be strings when style is ' +
                          style);
    }
  } else {//unrecognized style
    throw new Error('unrecognized style');
  }
  //create arrays to reference endpoints that match each half of this route
  this.from.matched = [];
  this.to.matched = [];
  //create a UUID for referencing this Route externally
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
 *   a map {type:string, from:{name:string, endpoint:string, metadata:object}, 
 *     to:{name:string, endpoint:string, metadata:object}},
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
      match = match && Leaf.metadataMatch(this.from.metadata, 
                                          otherRoute.from.metadata);
      match = match && Leaf.metadataMatch(this.to.metadata, 
                                          otherRoute.to.metadata);
    }
  }
  return match && true;
};

/**
 * returns a simple map of this routes data
 * @returns {Object} {type:string, style:string, uuid:string, 
 *   from:{name:string, metadata:object, endpoint:string, uuid:string}, 
 *   to:{name:string, metadata:object, endpoint:string, uuid:string}}
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

/**
 * gets a list of all connections this route is associated with
 * @returns {Array} [{type:string, from:{uuid:string, endpoint:string},
 *   to:{uuid:string, endpoint:string}, routes:[string,...]}]
 */
Route.prototype.getConnections = function(){
  var connections = [];

  //go through all publishers matched against this route
  var matchI = this.from.matched.length - 1;
  for(; matchI >= 0; matchI--){
    var pubClient = this.from.matched[matchI].client;
    var publisher = this.from.matched[matchI].endpoint;
    //for each connection associated with this publisher
    var connectionI = publisher.connectedTo.length - 1;
    for(; connectionI >= 0; connectionI--){
      var connection = publisher.connectedTo[connectionI];
      var subClient = connection.client;
      var subscriber = connection.endpoint;
      var connMap = {type:publisher.type,
                     from:{uuid:pubClient.uuid,
                           endpoint:publisher.name},
                     to:{uuid:subClient.uuid,
                         endpoint:subscriber.name},
                     routes:[]};
      //add all route uuids
      var routeI = connection.routes.length - 1;
      for(; routeI >= 0; routeI--){
        var route = connection.routes[routeI];
        connMap.routes.push(route.uuid);
      }
      connections.push(connMap);
    }
  }
  return connections;
};

/**
 * gets an array of only the backreferences in the resulting
 *   array from RegExp.exec or String.match
 * @param {Array} matchArray A resulting array from 
 *   RegExp.exec or String.match
 * @returns {Array} all array elements except for the first
 */
Route.getBackref = function(matchArray){
  //check truthiness
  if (matchArray){
    return matchArray.slice(1, matchArray.length);
  } else {
    return [];
  }
};

/**
 * replaces backreferences in the regular expression with
 *   captured strings. Supports up to nine backreferences
 *   labeled 1 - 9.
 * @param {Array} backref captured strings
 * @param {RegExp} regexp regular expression containing backreferences
 * @returns {RegExp} regular expression with backreferences replaced
 *   with actual string representations
 */
Route.subBackref = function(backref, regexp){
  var str = regexp.toString();
  for(var i = 1; i <= 9; i++){
    var replaceWith;
    if (backref.length >= i){
      replaceWith = backref[i - 1];
    } else {
      replaceWith = '\\' + (i - backref.length);
    }
    var str2 = str;
    do{
      str = str2;
      str2 = str.replace('\\' + i, replaceWith);
    }while(str !== str2);
  }
  //trim off the '/' characters at the beginning and end to parse correctly
  return new RegExp(str.substring(1, str.length - 1));
};

/**
 * Matches a list of regular expressions against a list of strings.
 *   capture groups from earlier regular expressions can be referenced
 *   by later expressions.
 * @param {Array} regexps An array of RegExp objects.
 * @param {Array} strings An array of strings to match against 
 *   the Regular Expressions. strings[0] will be matched against regexps[0]
 *   and so on.
 * @returns {boolean} true if all regular expressions match their
 *   respective string.
 */
Route.matchRegexpChain = function(regexps, strings){
  var matches = regexps.length === strings.length;
  var backref = [];
  for(var i = 0; i < regexps.length && matches; i++){
    var re = Route.subBackref(backref, regexps[i]);
    var str = strings[i];
    var match = re.exec(str);
    matches = (match !== null);
    if (matches){
      backref = backref.concat(Route.getBackref(match));
    }
  }
  return matches;
};

/**
 *
 * @param {Array} mRegexp an array of metadata regexp definitions from
 *   a Route.
 * @param {Object} mClient The Leaf metadata to validate
 * @returns {boolean} true if all the keys and values of the
 *   provided Client metadata object matches against an entry in the
 *   RegExp metadata matching array. Additionally, all entries in the 
 *   RegExp matching array must match against at least one of the 
 *   Client metadata properties.
 */
Route.metadataRegexpMatch = function(mRegexp, mClient){
  /** an array to make sure all entries in mRegexp are 
   *   sucessfully matched against */
  var regexpMatched = [];
  while(regexpMatched.length !== mRegexp.length){
    regexpMatched.push(false);
  }
  /** tracks whether the current property in the 
   *   Client metadata has been matched */
  var propMatched = true;

  //go through each key in the metadata
  var clientKeys = Object.keys(mClient);
  var metadataI = clientKeys.length - 1;
  for(; metadataI >= 0 && propMatched; metadataI--){
    var key = clientKeys[metadataI];
    propMatched = false;
    //see if there is a regex in the RegExp array that matches this key
    var regexpI = mRegexp.length - 1;
    for(; regexpI >= 0; regexpI--){
      if(propMatched && regexpMatched[regexpI]){
        continue;
      }
      var propRegexp = mRegexp[regexpI];
      if(Route.matchRegexpChain([propRegexp.key, 
                                 propRegexp.value],
                                [key,
                                 mClient[key]])){
        propMatched = true;
        regexpMatched[regexpI] = true;
      }
    }
  }

  var matched = propMatched;
  // check that all entries in the RegExp matching array
  //  have matched against something
  var reMatchI = regexpMatched.length - 1;
  for(; reMatchI >= 0 && matched; reMatchI--){
    matched = matched && regexpMatched[reMatchI];
  }
  return matched;
};

/**
 * determines whether the provided client matches the from-client
 *   specification of this route. This function does not look at
 *   the individual publishers of the client.
 * @param {Leaf} pubClient the client to test
 * @returns {boolean} true if the client is matched by this route
 */
Route.prototype.matchesFromClient = function(pubClient){
  var match = true;
  if (this.style === Route.styles.UUID){
    match = match && (pubClient.uuid === this.from.uuid);
  } else if(this.style === Route.styles.STRING){
    match = match && (pubClient.name === this.from.name);
    match = match && 
            Leaf.metadataMatch(pubClient.metadata, this.from.metadata);
  } else if(this.style === Route.styles.REGEXP){
    match = match && this.from.name.test(pubClient.name);
    match = match && 
            Route.metadataRegexpMatch(this.from.metadata, pubClient.metadata);
  } else {
    //unrecognized style...
    //maybe should throw an error
    match = false;
  }
  return match;
};

Route.prototype.matchesPublisher = function(pubClient, publisher){
  var match = this.matchesFromClient(pubClient);
  if (this.style === Route.styles.UUID || 
      this.style === Route.styles.STRING){
    match = match && (this.from.endpoint === publisher.name);
  } else if (this.style === Route.styles.REGEXP){
    match = match && Route.matchRegexpChain([this.from.name, 
                                             this.type,
                                             this.from.endpoint],
                                            [pubClient.name,
                                             publisher.type,
                                             publisher.name]);
  } else {
    //unrecognized style...
    //maybe should throw an error
    match = false;
  }
  return match;
};

Route.prototype.matchesPubToClient = function(pubClient, publisher, subClient){
  var match = this.matchesPublisher(pubClient, publisher);
  if (this.style === Route.styles.UUID){ 
    match = match && (this.to.uuid === subClient.uuid);
  } else if (this.style === Route.styles.STRING){
    match = match && (this.to.name === subClient.name);
  } else if (this.style === Route.styles.REGEXP){
    match = match && Route.matchRegexpChain([this.from.name, 
                                             this.type,
                                             this.from.endpoint,
                                             this.to.name],
                                            [pubClient.name,
                                             publisher.type,
                                             publisher.name,
                                             subClient.name]);
    match = match && 
            Route.metadataRegexpMatch(this.to.metadata, subClient.metadata);
  } else {
    //unrecognized style...
    //maybe should throw an error
    match = false;
  }
  return match;
};

Route.prototype.matchesPair = function(pubClient, publisher, 
                                       subClient, subscriber){
  var match = (publisher.type === subscriber.type);
  match = this.matchesPubToClient(pubClient, publisher, subClient);
  if (this.style === Route.styles.UUID || 
      this.style === Route.styles.STRING){
    match = match && (this.to.endpoint === subscriber.name);
  } else if (this.style === Route.styles.REGEXP){
    match = match && Route.matchRegexpChain([this.from.name, 
                                             this.type,
                                             this.from.endpoint,
                                             this.to.name,
                                             this.to.endpoint],
                                            [pubClient.name,
                                             publisher.type,
                                             publisher.name,
                                             subClient.name,
                                             subscriber.name]);
  } else {
    //unrecognized style...
    //maybe should throw an error
    match = false;
  }
  return match;
};

module.exports = Route;
