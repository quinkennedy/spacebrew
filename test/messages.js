/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var D = require('./data.js');
var d = new D();

describe('Sending/receiving messages', function(){
  it('nothing happens if no clients are registered', function(){
    var sb = new Spacebrew();
    expect(sb.published('uuid', 'publisher', 'message', 'type')).
      to.be.undefined;
  });
  it('call subscriber\'s callback', function(done){
    var message = 'check this out';
    var callback = function(sub, type, msg){
      expect(sub).to.equal(d.clientWithEndpoints2.subscribers[0].name);
      expect(type).to.equal(d.clientWithEndpoints2.subscribers[0].type);
      expect(msg).to.equal(message);
      done();
    };
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1);
    var client2 = D.initClient(d.clientWithEndpoints2, callback);
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.addClient(client2)).to.be.true;
    expect(sb.addRoute(route1)).to.be.true;
    sb.published(client1.uuid, 
                 client1.publishers[0].name, 
                 client1.publishers[0].type,
                 message);
  });
  it('don\'t call subscribers not associated with the connection', function(){
    var message = 'check this out';
    var callback = function(/*sub, type, msg*/){
      throw new Error('this should not be called');
    };
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1, callback);
    var client2 = D.initClient(d.clientWithEndpoints2);
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.addClient(client2)).to.be.true;
    expect(sb.addRoute(route1)).to.be.true;
    sb.published(client1.uuid, 
                 client1.publishers[0].name, 
                 client1.publishers[0].type,
                 message);
  });
});
