/**
 * Spacebrew admin class
 * @module spacebrew/admin
 */

var uuid = require('uuid');
var Leaf = require('./leaf.js');

/**
 * Creates an instance of a Spacebrew Admin
 * @constructor
 * @param {function} sendCallback function that will be called 
 *   when a message is being sent to this Admin
 * @param {object} [options] an optional map of options for controlling
 *   what messages/how verbose communication is
 */
var Admin = function(sendCallback, 
                     options){
  
  /** the function that will be called when a message is going to this admin */
  this.sendCallback = Leaf.verifyFunction(sendCallback); 
  /** time-based uuid for identifying this leaf */
  this.uuid = uuid.v1();
  //clean/verify options
  this.options = Admin.cleanConfig(options);
};

/**
 * Returns true if the provided admin matches this admin.
 * @param {Object|string} otherAdmin Admin to compare against.
 *   Can either be another Admin object, 
 *   or a uuid
 * @return {boolean} true if the admins match
 */
Admin.prototype.matches = function(otherAdmin){
  var match = true;
  if (typeof(otherAdmin) == 'string'){
    var otherUuid = otherAdmin;
    match = match && (this.uuid === otherUuid);
  } else {
    match = match && (this === otherAdmin);
  }
  return match;
};

/**
 * Gets this admin's data as a simple map
 * @returns {Object} {uuid:string}
 */
Admin.prototype.toMap = function(){
  var map = {uuid:this.uuid};
  return map;
};

Admin.messageTypes = {};
Admin.messageTypes.ADD = 'add';
Admin.messageTypes.REMOVE = 'remove';
Admin.messageTypes.PUBLISHED = 'published';


Admin.prototype.sendAdd = function(clients, routes, connections){
  clients = clients || [];
  routes = routes || [];
  connections = connections || [];

  if (clients instanceof Array && 
      routes instanceof Array && 
      connections instanceof Array){
    this.sendCallback(Admin.messageTypes.ADD, 
                      {clients:clients,
                       routes:routes,
                       connections:connections});
  } else {
    throw new TypeError(
      'clients, routes, and connections must all be Arrays (or undefined)');
  }
};

Admin.prototype.sendRemove = function(clients, routes, connections){
  this.sendCallback(Admin.messageTypes.REMOVE,
                    {clients:clients,
                     routes:routes,
                     connections:connections});
};

Admin.prototype.published = function(pubClient, pubName, type, message){
  var data = {client:pubClient.toMap(),
              publisher:{name:pubName,
                         type:type}};
  if (this.options[Admin.configs.NO_MSGS.key] === 'false'){
    data.message = message;
  }
  this.sendCallback(Admin.messageTypes.PUBLISHED, data);
};

Admin.configs = [];
Admin.configs.NO_MSGS = {key:'no_msgs',
                         values:['false','true']};
(function listFromMap(list, map){
  var keys = Object.keys(map);
  for(var i = 0; i < keys.length; i++){
    list.push(map[keys[i]]);
  }
}).call(this, Admin.configs, Admin.configs);

/**
 * cleans up the configs to conform to single-level expectation
 * @param {Object} config The config object to sanitize.
 *   Ideally this object only contains values that are numbers or strings.
 * @return {Object} the passed in config object with all functions,
 *   objects, arrays, etc. removed. {key:string|number,...}
 */
Admin.cleanConfig = function(config){
  var cleaned = {};
  //for each allowed config
  var configI = Admin.configs.length - 1;
  for(; configI >= 0; configI--){
    var configDef = Admin.configs[configI];
    var currValue = String(config[configDef.key]);
    var matched = false;
    //for each allowed value
    var valueI = configDef.values.length - 1;
    for(; valueI >= 0 && !matched; valueI--){
      var value = configDef.values[valueI];
      //see if the passed-in value matches
      var split = currValue.split(value);
      matched = (split.length == 2 && split[0] == '' && split[1] == '');
    }
    //if it matches, use it as-is
    // otherwise, use the default value
    if (matched){
      cleaned[configDef.key] = currValue;
    } else {
      cleaned[configDef.key] = configDef.values[0];
    }
  }
  return cleaned;
};

module.exports = Admin;
