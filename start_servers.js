#!/usr/bin/env node

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
  console.log('processing',process.argv);
  var argv = process.argv;
  for(var i = 2; i < argv.length; ){
    i = startServer(argv, i);
  }
}

function startServer(argv, index){
  var server = {};
  var i = index;
  var name = argv[i];
  i++;
  try {
    console.log('loading',name);
    server.module = require(name);
    var options = {};
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
    server.instance = new server.module(manager, options, this.logger);
  } catch (e){
    console.error(e);
    server.error = e;
  }

  servers[name] = server;
  return i;
}
