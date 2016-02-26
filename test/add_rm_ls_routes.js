/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var Route = require('../route.js');

describe('route mgmnt', function(){
  it('getRoutes() should return an empty array if no routes have been added',
    function() {
      var sb = new Spacebrew();
      expect(sb.getRoutes()).to.deep.equal([]);
    }
  );
  describe('adding/removing routes', function(){
    var sb;
    var route1d = {style:Route.styles.STRING,
                   type:'string',
                   from:{name:'client1',
                         endpoint:'pub1_1',
                         metadata:{}},
                   to:{name:'client2',
                       endpoint:'sub2_1',
                       metadata:{}}};
    var route2d = {style:Route.styles.STRING,
                   type:'string',
                   from:{name:'client2',
                         endpoint:'pub2_1',
                         metadata:{}},
                   to:{name:'client1',
                       endpoint:'sub1_1',
                       metadata:{}}};
    var initRoute = function(data){
      var fromId, toId;
      if (data.style === Route.styles.UUID){
        fromId = data.from.uuid;
        toId = data.to.uuid;
      } else {
        fromId = {name:data.from.name,
                  metadata:data.from.metadata};
        toId = {name:data.to.name,
                metadata:data.to.metadata};
      }
      return new Route(data.style,
                       data.type,
                       fromId,
                       data.from.endpoint,
                       toId,
                       data.to.endpoint);
    };

    var route1 = initRoute(route1d);
    var route2 = initRoute(route2d);

    route1d.uuid = route1.uuid;
    route2d.uuid = route2.uuid;

    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addRoute(route2)).to.be.true;
      expect(sb.getRoutes()).to.deep.equal([route1d, route2d]);
    });
    it('getRoutes() should return array of routes that have been added',
      function(){
        expect(sb.getRoutes()).to.deep.equal([route1d, route2d]);
      }
    );
    it('getRoutes() should not include any routes which have been removed',
      function(){
        expect(sb.removeRoute(route1)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([route2d]);
        expect(sb.removeRoute(route2)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([]);
      }
    );
    it('adding a route that already exists should be prohibited',
      function(){
        expect(sb.addRoute(route1)).to.be.false;
        expect(sb.addRoute(initRoute(route1d))).to.be.false;
        expect(sb.getRoutes()).to.deep.equal([route1d, route2d]);
      }
    );
    it('removing routes that don\'t exist should not be valid',
      function(){
        expect(sb.removeRoute(route1)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([route2d]);
        expect(sb.removeRoute(route1)).to.be.false;
        expect(sb.getRoutes()).to.deep.equal([route2d]);
      }
    );
  });
});
