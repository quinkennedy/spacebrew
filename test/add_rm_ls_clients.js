/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var Client = require('../leaf.js');
var D = require('./data.js');
var d = new D();

describe('client mgmnt', function(){
  it('getClients() should return an empty array if no clients have been added',
    function() {
      var sb = new Spacebrew();
      expect(sb.getClients()).to.deep.equal([]);
    }
  );
  describe('adding/removing clients', function(){
    var sb;
    var client1 = D.initClient(d.client1);
    var client2 = D.initClient(d.client2);
    var client1_copy = D.initClient(d.client1);

    d.client1.uuid = client1.uuid;
    d.client2.uuid = client2.uuid;

    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
    });
    it('getClients() should return an array of clients that have been added',
      function() {
        expect(sb.getClients()).
          to.deep.equal([d.client1, d.client2]);
      }
    );
    it('getClients() should not include any clients which have been removed',
      function(){
        expect(sb.removeClient(client2)).to.be.true;
        expect(sb.getClients()).
          to.deep.equal([d.client1]);
        expect(sb.removeClient(client1_copy)).to.be.true;
        expect(sb.getClients()).to.deep.equal([]);
      }
    );
    it('getClients() should not add any clients which already exist',
      function(){
        expect(sb.addClient(client1)).to.be.false;
        expect(sb.getClients()).to.deep.equal([d.client1, d.client2]);
      }
    );
    it('getClients() should not add any clients which are too similar',
      function(){
        expect(sb.addClient(client1_copy)).to.be.false;
        expect(sb.getClients()).to.deep.equal([d.client1, d.client2]);
      }
    );
    it('removeClient() should not remove any clients if there is no match',
      function(){
        expect(sb.removeClient(d.client1)).to.be.true;
        expect(sb.removeClient(d.client1)).to.be.false;
        expect(sb.getClients()).to.deep.equal([d.client2]);
        expect(sb.removeClient(d.client2)).to.be.true;
        expect(sb.removeClient(d.client2)).to.be.false;
        expect(sb.getClients()).to.deep.equal([]);
      }
    );
  });
});
