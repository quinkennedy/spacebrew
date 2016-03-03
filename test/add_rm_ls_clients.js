/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var D = require('./data.js');
var d = new D();

describe('client mgmnt', function(){
  describe('get client list', function(){
    it('returns an empty array if no clients have been added', function(){
      var sb = new Spacebrew();
      expect(sb.getClients()).to.deep.equal([]);
    });
  });

  var sb;
  var client1 = D.initClient(d.client1);
  var client2 = D.initClient(d.client2);
  var client1_copy = D.initClient(d.client1);

  d.client1.uuid = client1.uuid;
  d.client2.uuid = client2.uuid;

  describe('adding clients', function(){
    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
    });
    it('adds unique clients', function(){
      expect(sb.getClients()).
        to.deep.equal([d.client1, d.client2]);
    });
    it('does not add clients that are already registered.', function(){
      expect(sb.addClient(client1)).to.be.false;
      expect(sb.getClients()).to.deep.equal([d.client1, d.client2]);
    });
    it('does not add clients which are too similar', function(){
      expect(sb.addClient(client1_copy)).to.be.false;
      expect(sb.getClients()).to.deep.equal([d.client1, d.client2]);
    });
  });
  describe('removing clients', function(){
    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
    });
    it('removes specified clients', function(){
      expect(sb.removeClient(client2)).to.be.true;
      expect(sb.getClients()).
        to.deep.equal([d.client1]);
      expect(sb.removeClient(client1_copy)).to.be.true;
      expect(sb.getClients()).to.deep.equal([]);
    });
    it('should not remove any clients if there is no match', function(){
      expect(sb.removeClient(d.client1)).to.be.true;
      expect(sb.removeClient(d.client1)).to.be.false;
      expect(sb.getClients()).to.deep.equal([d.client2]);
      expect(sb.removeClient(d.client2)).to.be.true;
      expect(sb.removeClient(d.client2)).to.be.false;
      expect(sb.getClients()).to.deep.equal([]);
    });
  });
});
