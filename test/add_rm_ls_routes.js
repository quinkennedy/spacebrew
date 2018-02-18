/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var D = require('./data.js');
var d = new D();

describe('route mgmnt', function(){
  describe('list routes', function(){
    it('returns an empty array if no routes have been added', function(){
      var sb = new Spacebrew();
      expect(sb.getRoutes()).to.deep.equal([]);
    });
  });

  var sb;
  var route1 = D.initRoute(d.route1);
  var route2 = D.initRoute(d.route2);

  d.route1.uuid = route1.uuid;
  d.route2.uuid = route2.uuid;

  describe('adding routes', function(){
    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addRoute(route2)).to.be.true;
    });
    it('adds routes', function(){
      expect(sb.getRoutes()).to.deep.equal([d.route1, d.route2]);
    });
    it('does not add a route that already exists', function(){
      expect(sb.addRoute(route1)).to.be.false;
      expect(sb.addRoute(D.initRoute(d.route1))).to.be.false;
      expect(sb.getRoutes()).to.deep.equal([d.route1, d.route2]);
    });
  });
  describe('removing routes', function(){
    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addRoute(route1)).to.be.true;
      expect(sb.addRoute(route2)).to.be.true;
    });
    it('removes routes',
       function(){
         expect(sb.removeRoute(route1)).to.be.true;
         expect(sb.getRoutes()).to.deep.equal([d.route2]);
         expect(sb.removeRoute(route2)).to.be.true;
         expect(sb.getRoutes()).to.deep.equal([]);
       }
    );
    it('does not remove routes that are not registered', function(){
      expect(sb.removeRoute(route1)).to.be.true;
      expect(sb.getRoutes()).to.deep.equal([d.route2]);
      expect(sb.removeRoute(route1)).to.be.false;
      expect(sb.getRoutes()).to.deep.equal([d.route2]);
    });
  });
});
