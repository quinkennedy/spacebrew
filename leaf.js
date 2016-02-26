/**
 * Spacebrew leaf (aka Client) class
 * @module spacebrew/leaf
 */

var uuid = require('node-uuid');

/**
 * Creates an instance of a Spacebrew Leaf
 * @constructor
 * @param name {string}
 * @param subscribers {Array} expected format [{name:string, type:string},...]
 * @param publishers {Array} expected format [{name:string, type:string, default:],...]
 * @param sendCallback {function} function that will be called when a message is being sent to this Client
 * @param description {string} human-readable description
 * @param metadata {Object} free-form-ish metadata map
 */
var Leaf = function(name, subscribers, publishers, sendCallback, description, metadata){
  
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
 * @returns {Object} {name:string, description:string, subscribers:Array, publishers:Array, metadata:Object}
 */
Leaf.prototype.toMap = function(){
  return {name:this.name,
          description:this.description,
          subscribers:this.subscribers,
          publishers:this.publishers,
          metadata:this.metadata,
          uuid:this.uuid};
};

/**
 * Standardizes a subscriber list to ensure that it contains
 *   only the necessary data
 * @param subscriberList {Array} An array that contains subscriber information. 
 *   Ideally this is in the same format as will be returned by this function.
 * @return {Array} the cleaned-up list of subscribers. 
 *   Any malformed subscribers are excluded. 
 *   [{name:string, type:string},...]
 */
Leaf.cleanSubscribers = function(subscriberList){
  var subs = [];
  for(var i = 0; Array.isArray(subscriberList) && i < subscriberList.length; i++){
    var curr = subscriberList[i];
    subs.push({name:'' + curr.name, 
               type:'' + curr.type});
  }
  return subs;
};

/**
 * Standardizes a publisher list to ensure that it contains
 *   only the necessary data
 * @param publisherList {Array} An array that contains publisher information.
 *   Ideally this is in the same format as will be returned by this function.
 * @return {Array} the cleaned-up list of publishers.
 *   Any malformed publishers are excluded. 
 *   [{name:string, type:string, default:},...]
 */
Leaf.cleanPublishers = function(publisherList){
  var pubs = [];
  for(var i = 0; Array.isArray(publisherList) && i < publisherList.length; i++){
    var curr = publisherList[i];
    pubs.push({name:'' + curr.name, 
               type:'' + curr.type, 
               default:'' + curr.default});
  }
  return pubs;
};

/**
 * Verifies that the function provided is actually a function
 * @param func {function} The function to test
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
 * @param metadata {Object} The metadata object to sanitize.
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
 * Returns true if both metadata objects have the same keys and associated values
 * @param mA {Object} A metadata object to compare against
 * @param mB {Object} A metadata object to compare against
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
