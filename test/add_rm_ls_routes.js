/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var D = require('./data.js');
var d = new D();

describe('route mgmnt', function(){
  it('getRoutes() should return an empty array if no routes have been added',
    function() {
      var sb = new Spacebrew();
      expect(sb.getRoutes()).to.deep.equal([]);
    }
  );
  describe('adding/removing routes', function(){
    var sb;

    var route1 = D.initRoute(d.route1);
    var route2 = D.initRoute(d.route2);

    d.route1.uuid = route1.uuid;
    d.route2.uuid = route2.uuid;

    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addRoute(route2)).to.be.true;
      expect(sb.getRoutes()).to.deep.equal([d.route1, d.route2]);
    });
    it('getRoutes() should return array of routes that have been added',
      function(){
        expect(sb.getRoutes()).to.deep.equal([d.route1, d.route2]);
      }
    );
    it('getRoutes() should not include any routes which have been removed',
      function(){
        expect(sb.removeRoute(route1)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([d.route2]);
        expect(sb.removeRoute(route2)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([]);
      }
    );
    it('adding a route that already exists should be prohibited',
      function(){
        expect(sb.addRoute(route1)).to.be.false;
        expect(sb.addRoute(D.initRoute(d.route1))).to.be.false;
        expect(sb.getRoutes()).to.deep.equal([d.route1, d.route2]);
      }
    );
    it('removing routes that don\'t exist should not be valid',
      function(){
        expect(sb.removeRoute(route1)).to.be.true;
        expect(sb.getRoutes()).to.deep.equal([d.route2]);
        expect(sb.removeRoute(route1)).to.be.false;
        expect(sb.getRoutes()).to.deep.equal([d.route2]);
      }
    );
  });
});
