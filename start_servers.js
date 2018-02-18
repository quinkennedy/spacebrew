#!/usr/bin/env node
/* eslint no-console: 0 */

/**
 * This is a command-line script for launching various servers
 *   all attached to the same Spacebrew Manager
 */

var Spacebrew = require('./core.js');

var manager = new Spacebrew();
var servers = {};

processArguments();

/**
 * Processes the command line arguments when app is launched
 */
function processArguments(){
  var argv = process.argv;
  for(var i = 2; i < argv.length; ){
    i = startServer(argv, i);
  }
}

/**
 * Collect the options and start the server defined at the specific index
 *   in the argument list
 * @param {string[]} argv argument list
 * @param {number} index index into argument list to start parsing
 * @returns {number} the next index in the argument list to start 
 *   processing from
 */
function startServer(argv, index){
  var server = {};
  var i = index;
  var name = argv[i];
  i++;
  try {
    server.module = require(name);
  } catch (e){
    if (e.code == 'MODULE_NOT_FOUND'){
      console.error('%s not installed. Run `npm install %s` and try again',
                    name, name);
    } else {
      console.error(e);
    }
    server.error = e;
  }

  //regardless, we need to parse the options out of the arguments list
  var options = {};
  i = gatherOptions(argv, i, options);

  //start the server with the specified options
  if (!server.error){
    try {
      server.instance = new server.module(manager, options, this.logger);
      console.log('running %s', name);
    } catch (e){
      console.error(e);
      server.error = e;
    }
  }

  servers[name] = server;
  return i;
}

/**
 * Gathers server options from the arguments list
 * @param {string[]} argv arguments list
 * @param {number} index current index into the arguments list to start
 *   parsing options from
 * @param {object} options An object to fill based on parsed options
 * @returns {number} index for next command-line argument to process
 */
function gatherOptions(argv, index, options){
  var i = index;
  for( ; i < argv.length; ){
    if (argv[i].startsWith('--')){
      var key = argv[i].substring(2);
      i++;
      var value = argv[i];
      i++;
      options[key] = value;
    } else {
      break;
    }
  }
  return i;
}
