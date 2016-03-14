var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var JsonComm = require('../json_comm.js');
var D = require('./data.js');
var d = new D();

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
var manager, jsonComm;
var clientCallback, adminCallback;

var removeUUIDs = function(clientList){
  for(var i = clientList.length - 1 ; i >= 0; i--){
    delete clientList[i].uuid;
  }
};

describe('test JSON interface', function(){
  beforeEach(function(){
    //create the spacebrew manager
    manager = new Spacebrew();
    //create the json communication interface
    jsonComm = new JsonComm(
      manager, 
      function(message, handle){
        clientCallback && clientCallback(message, handle);
      }, 
      function(message, handle){
        adminCallback && adminCallback(message, handle);
      },
      console);
    adminCallback = clientCallback = function(){expect(false);};
  });
  it('can add a client', function(){
    jsonComm.handleMessage(D.addClientJson(d.clientWithEndpoints1), 
                           {ip:'127.0.0.1'},
                           clientHandle);
    var clientList = manager.getClients();
    removeUUIDs(clientList);
    var wantedList = [d.clientWithEndpoints1];
    wantedList[0].metadata.ip = '127.0.0.1';
    wantedList[0].publishers[0].default = 'undefined';
    expect(clientList).to.deep.equal(wantedList);
  });
  it('get client list when registering as an admin', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var clientJson = D.addClientJson(d.clientWithEndpoints1);
      clientJson.config.remoteAddress = '127.0.0.1';
      expect(message).to.deep.equal([clientJson]);
      done();
    };
    jsonComm.handleMessage(D.addClientJson(d.clientWithEndpoints1),
                           {ip:'127.0.0.1'},
                           clientHandle);
    expect(manager.getClients()).to.be.length(1);
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
  });
  it('update list is empty when first registering admin', function(done){
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      expect(message).to.deep.equal([]);
      done();
    };
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
  });
  it('admin is notified of clients being added', function(done){
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var clientJson = D.addClientJson(d.clientWithEndpoints1);
      clientJson.config.remoteAddress = '127.0.0.1';
      expect(message).to.deep.equal([clientJson]);
      done();
    };
    jsonComm.handleMessage(D.addClientJson(d.clientWithEndpoints1),
                           {ip:'127.0.0.1'},
                           clientHandle);
  });
  it('admin is not notified of routes that don\'t create connections',
    function(){
      adminCallback = function(message, handle){
        expect(handle).to.equal(adminHandle);
        expect(message).to.deep.equal([]);
      };
      jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
      adminCallback = function(/*message, handle*/){
        expect(false);
      };
      jsonComm.handleMessage(D.addRouteJson(d.stringRoute),adminHandle);
    }
  );
  it('admin is notified of connections being made', function(done){
    jsonComm.handleMessage(D.addClientJson(d.clientWithEndpoints1),
                           {ip:'127.0.0.1'},
                           clientHandle);
    expect(manager.getClients()).to.be.length(1);
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var clientJson = D.addClientJson(d.clientWithEndpoints1);
      clientJson.config.remoteAddress = '127.0.0.1';
      expect(message).to.deep.equal([clientJson]);
    };
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
    adminCallback = function(message, handle){
      var routeMsg = D.addRouteJson(d.route3);
      expect(handle).to.equal(adminHandle);
      expect(message).to.deep.equal([routeMsg]);
      done();
    };
    
    jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
  });
  it('admin is notified when new client triggers connections being made ',
    function(done){
      //register the admin
      adminCallback = function(message, handle){
        expect(handle).to.equal(adminHandle);
        expect(message).to.deep.equal([]);
      };
      jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
      //regsiter the Route
      adminCallback = function(/*message, handle*/){
        expect(false);
      };
      jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
      //register the Client
      adminCallback = function(message, handle){
        expect(handle).to.equal(adminHandle);
        var clientJson = D.addClientJson(d.clientWithEndpoints1);
        var routeMsg = D.addRouteJson(d.route3);
        clientJson.config.remoteAddress = '127.0.0.1';
        expect(message).to.deep.equal([clientJson,routeMsg]);
        done();
      };
      jsonComm.handleMessage(D.addClientJson(d.clientWithEndpoints1),
                             {ip:'127.0.0.1'},
                             clientHandle);
    }
  );
 // it('can send and receive messages', function(done){
 //   var publishedMsg = {message:{clientName:'client',
 //                                name:'pub',
 //                                type:'string',
 //                                value:'message'}};
 //   var callbackCount = 0;
 //   var gotCallback = function(){
 //     callbackCount++;
 //     if (callbackCount === 2){
 //       done();
 //     }
 //   };
 //   adminCallback = function(message, handle){
 //     expect(handle).to.equal(adminHandle);
 //     expect(message).to.deep.equal(publishedMsg);
 //     gotCallback();
 //   };
 //   clientCallback = function(message, handle){
 //     expect(handle).to.equal(clientHandle);
 //     var receivedMsg = publishedMsg;
 //     receivedMsg.name = 'sub';
 //     expect(message).to.deep.equal(receivedMsg);
 //     gotCallback();
 //   };
 //   JsonComm.handleMessage(publishedMsg, clientHandle);
 // });
 // it('can remove a route', function(done){
 //   adminCallback = function(message, handle){
 //     expect(handle).to.equal(adminHandle);
 //     done();
 //   };
 // });
 // it('can remove a client', function(done){
 //   adminCallback = function(message, handle){
 //     expect(handle).to.equal(adminHandle);
 //     done();
 //   };
 //   clientCallback = undefined;
 // });
});
