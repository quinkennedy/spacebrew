/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
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
  it('connections are removed if the subscriber client leaves', function(){
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1);
    var client2 = D.initClient(d.clientWithEndpoints2);
    expect(sb.addRoute(route1)).to.be.true;
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.addClient(client2)).to.be.true;
    expect(sb.getConnections()).to.have.lengthOf(1);
    expect(sb.removeClient(client2.uuid)).to.be.true;
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('connections are removed if the publisher client leaves', function(){
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1);
    var client2 = D.initClient(d.clientWithEndpoints2);
    expect(sb.addRoute(route1)).to.be.true;
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.addClient(client2)).to.be.true;
    expect(sb.getConnections()).to.have.lengthOf(1);
    expect(sb.removeClient(client1.uuid)).to.be.true;
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('connections are removed if the specifying route leaves', function(){
    var sb = new Spacebrew();
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1);
    var client2 = D.initClient(d.clientWithEndpoints2);
    expect(sb.addRoute(route1)).to.be.true;
    expect(sb.addClient(client1)).to.be.true;
    expect(sb.addClient(client2)).to.be.true;
    expect(sb.getConnections()).to.have.lengthOf(1);
    expect(sb.removeRoute(route1.uuid)).to.be.true;
    expect(sb.getConnections()).to.deep.equal([]);
  });
  it('connections are maintained if one of many specifying routes leaves',
    function(){
      var sb = new Spacebrew();
      var route1 = D.initRoute(d.route1);
      var client1 = D.initClient(d.clientWithEndpoints1);
      var client2 = D.initClient(d.clientWithEndpoints2);
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
      expect(sb.getConnections()).to.have.lengthOf(1);
      expect(sb.getConnections()[0].routes).to.deep.equal([route1.uuid]);
      var route2D = {style:Route.styles.UUID,
                     type:d.route1.type,
                     from:{uuid:client1.uuid,
                           endpoint:d.route1.from.endpoint},
                     to:{uuid:client2.uuid,
                         endpoint:d.route1.to.endpoint}};
      var route2 = D.initRoute(route2D);
      expect(sb.addRoute(route2)).to.be.true;
      expect(sb.getConnections()).to.have.lengthOf(1);
      expect(sb.getConnections()[0].routes).
        to.have.members([route1.uuid, route2.uuid]);
      expect(sb.removeRoute(route1.uuid)).to.be.true;
      expect(sb.getConnections()).to.have.lengthOf(1);
      expect(sb.getConnections()[0].routes).to.deep.equal([route2.uuid]);
    }
  );
});
