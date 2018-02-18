#!/usr/bin/env node
/* eslint no-console: 0 */

var Spacebrew = require('./core.js');//@spacebrew/server-core').Manager;

var manager = new Spacebrew();
var serverList = [];
var argv = process.argv.splice(2, process.argv.length);

/**
 * Processes command arguments and runs the specified server
 * @param {string} moduleName the name of the module to launch
 * @param {number} argvIndex index into argument list 
 * @return {number} index for next unprocessed argument
 */
function startServer(moduleName, argvIndex){
  var options = {};
  //process arguments for this specific server
  for(; argvIndex < argv.length; argvIndex += 2){
    //if we hit an argument that doesn't begin with `--`
    // then we have processed all the arguments specific to this server
    if (!argv[argvIndex].startsWith('--')){
      break;
    }
    //add argument to options list
    options[argv[argvIndex].substring(2)] = argv[argvIndex + 1];
  }
  try {
    var Server = require(moduleName);
    serverList.push(new Server(manager, options, this.logger));
    console.log('started ' + moduleName);
  } catch (e){
    //TODO: better logging
    console.error('error starting ' + moduleName + ' ' + e);
  }
  return argvIndex;
}

/**
 * Processes command-line arguments
 */
function processArguments(){
  for(var i = 0; i < argv.length;){
    var moduleName = argv[i];
    i = startServer(moduleName, i + 1);
  }
}

processArguments();

//var Servers = function(){
//  this.manager = new Spacebrew();
//};
//
//Servers.prototype.startWebsocket = function(){
//  this.websocketServer = 
//    new WebSocketServer(this.manager,
//                        {port:9000, host:'0.0.0.0'},
//                        this.logger);
//};
//
//module.exports = Servers;
