var chai = require('chai');
var expect = chai.expect;

//create the spacebrew manager
var manager = new (require('../core.js'))();
//create the json communication interface
var clientCallback, adminCallback;
var JsonComm = new (require('../json_comm.js'))(
  manager, 
  function(handle){clientCallback(handle);}, 
  function(handle){adminCallback(handle);});
/*
//create the servers
var WsServer = 
  new (require('../websocket_server.js'))(
    manager,
    9000,
    '0.0.0.0');
var UdpServer =
  new (require('../udp_server.js'))(
    manager,
    9000,
    '0.0.0.0');
var TcpServer =
  new (require('../tcp_server.js'))(
    manager,
    9000,
    '0.0.0.0');
var RestServer =
  new (require('../rest_server.js'))(
    manager,
    9000,
    '0.0.0.0');
var HttpServer =
  new (require('../http_server.js'))(
    manager,
    9000,
    '0.0.0.0');
*/

var clientHandle = {};
var adminHandle = {};

describe('test JSON communication', function(){
  it('can add a client', function(){
    JsonComm.handleMessage({name:'client',
                            description:'test client',
                            publish:{messages:[]},
                            subscribe:{messages:[]},
                            options:{}},
                           {ip:'127.0.0.1'},
                           clientHandle);
  });
  it('can register as an admin', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      expect(message).to.deep.equal({config:{name:'client',
                                             description:'test client',
                                             publish:{messages:[]},
                                             subscribe:{messages:[]},
                                             metadata:{ip:'127.0.0.1'}}});
      done();
    };
    JsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
  });
  it('can add a route', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      expect(message).to.deep.equal(/*route message*/);
      done();
    };
    JsonComm.handleMessage(/*route message*/);
  });
  it('can send and receive messages', function(done){
    var callbackCount = 0;
    var gotCallback = function(){
      callbackCount++;
      if (callbackCount === 2){
        done();
      }
    };
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      gotCallback();
    };
    clientCallback = function(message, handle){
      expect(handle).to.equal(clientHandle);
      gotCallback();
    };
    JsonComm.handleMessage(/*message*/);
  });
  it('can remove a client', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      done();
    };
    clientCallback = undefined;
  });
  it('can remove a route', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      done();
    };
  });
});
