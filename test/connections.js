/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var Leaf = require('../leaf.js');
var Route = require('../route.js');
var D = require('./data.js');
var d = new D();

describe('testing connections', function(){
  it('there are no connections when we start', function(){
    var sb = new Spacebrew();
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('no connections if we have clients and no routes', function(){
    var sb = new Spacebrew();
    var client1 = D.initClient(d.client1);
    d.client1.uuid = client1.uuid;
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('no connections if we have routes and no clients', function(){
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    d.route1.uuid = route1.uuid;
    expect(sb.addRoute(route1)).to.be.true;
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('connections appear when a route matches both a publisher and subscriber',
    function(){
      var sb = new Spacebrew();
      var route1 = D.initRoute(d.route1);
      var client1 = D.initClient(d.clientWithEndpoints1);
      var client2 = D.initClient(d.clientWithEndpoints2);
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.getConnections()).to.deep.equal(
        [{type:d.route1.type,
          from:{uuid:client1.uuid,
                endpoint:d.clientWithEndpoints1.publishers[0].name},
          to:{uuid:client2.uuid,
              endpoint:d.clientWithEndpoints2.subscribers[0].name},
          routes:[route1.uuid]}]);
    }
  );
  it('connections also appear if routes are defined first',
    function(){
      var sb = new Spacebrew();
      var route1 = D.initRoute(d.route1);
      var client1 = D.initClient(d.clientWithEndpoints1);
      var client2 = D.initClient(d.clientWithEndpoints2);
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
      expect(sb.getConnections()).to.deep.equal(
        [{type:d.route1.type,
          from:{uuid:client1.uuid,
                endpoint:d.clientWithEndpoints1.publishers[0].name},
          to:{uuid:client2.uuid,
              endpoint:d.clientWithEndpoints2.subscribers[0].name},
          routes:[route1.uuid]}]);
    }
  );
});
