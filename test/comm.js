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
  it('admin is notified of clients being removed', function(done){
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
    var client = jsonComm.handleMessage(
      D.addClientJson(d.clientWithEndpoints1),
      {ip:'127.0.0.1'},
      clientHandle);
    //unregister client
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var clientRemove = {remove:[{name:d.clientWithEndpoints1.name,
                                   remoteAddress:'127.0.0.1'}],
                          targetType:'admin'};
      expect(message).to.deep.equal([clientRemove]);
      done();
    };
    manager.removeClient(client);
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
  it('admin is notified when connections are broken', function(done){
    //register client
    var client = jsonComm.handleMessage(
      D.addClientJson(d.clientWithEndpoints1),
      {ip:'127.0.0.1'},
      clientHandle);
    //register route
    jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
    //register admin
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
    //unregister client
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var clientRemove = {remove:[{name:d.clientWithEndpoints1.name,
                                   remoteAddress:'127.0.0.1'}],
                          targetType:'admin'};
      var routeMsg = D.rmRouteJson(d.route3);
      expect(message).to.deep.equal([clientRemove,routeMsg]);
      done();
    };
    manager.removeClient(client);
  });
  it('admin is notified when connections are broken by route removal', 
     function(done){
       //register client
       jsonComm.handleMessage(
         D.addClientJson(d.clientWithEndpoints1),
         {ip:'127.0.0.1'},
         clientHandle);
       //register route
       jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
       //register admin
       jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
       //unregister route
       adminCallback = function(message, handle){
         expect(handle).to.equal(adminHandle);
         var routeMsg = D.rmRouteJson(d.route3);
         expect(message).to.deep.equal([routeMsg]);
         done();
       };
       jsonComm.handleMessage(D.rmRouteJson(d.route3), adminHandle);
     }
  );
  it('routes can be remoed directly too', 
     function(done){
       //register client
       jsonComm.handleMessage(
         D.addClientJson(d.clientWithEndpoints1),
         {ip:'127.0.0.1'},
         clientHandle);
       //register route
       var route = jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
       //register admin
       jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
       //unregister route
       adminCallback = function(message, handle){
         expect(handle).to.equal(adminHandle);
         var routeMsg = D.rmRouteJson(d.route3);
         expect(message).to.deep.equal([routeMsg]);
         done();
       };
       manager.removeRoute(route);
     }
  );
  it('can send and receive messages', function(done){
    var publishedMsg = 
      {message:{clientName:d.clientWithEndpoints1.name,
                name:d.clientWithEndpoints1.publishers[0].name,
                type:d.clientWithEndpoints1.publishers[0].type,
                value:'message'}};
    //register client
    jsonComm.handleMessage(
      D.addClientJson(d.clientWithEndpoints1),
      {ip:'127.0.0.1'},
      clientHandle);
    //register route
    jsonComm.handleMessage(D.addRouteJson(d.route3),adminHandle);
    //register admin
    jsonComm.handleMessage({admin:true},{ip:'127.0.0.1'},adminHandle);
    //send message
    var callbackCount = 0;
    var gotCallback = function(){
      callbackCount++;
      if (callbackCount === 2){
        done();
      }
    };
    adminCallback = function(message, handle){
      expect(handle).to.equal(adminHandle);
      var adminMsg = JSON.parse(JSON.stringify(publishedMsg));
      adminMsg.message.remoteAddress = '127.0.0.1';
      adminMsg.targetType = 'admin';
      expect(message).to.deep.equal(adminMsg);
      gotCallback();
    };
    clientCallback = function(message, handle){
      expect(handle).to.equal(clientHandle);
      var receivedMsg = JSON.parse(JSON.stringify(publishedMsg));
      receivedMsg.message.name = d.clientWithEndpoints1.subscribers[0].name;
      expect(message).to.deep.equal(receivedMsg);
      gotCallback();
    };
    jsonComm.handleMessage(publishedMsg, {ip:'127.0.0.1'}, clientHandle);
  });
});
