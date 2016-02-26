/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Spacebrew = require('../core.js');
var Client = require('../leaf.js');

describe('client mgmnt', function(){
  it('getClients() should return an empty array if no clients have been added',
    function() {
      var sb = new Spacebrew();
      expect(sb.getClients()).to.deep.equal([]);
    }
  );
  describe('adding/removing clients', function(){
    var sb;
    var client1d = {name:'client1',
                    publishers:[],
                    subscribers:[],
                    description:'test client',
                    metadata:{}};
    var client2d = {name:'client2',
                    publishers:[],
                    subscribers:[],
                    description:'test client',
                    metadata:{}};
    var client1 = new Client(client1d.name,
                             client1d.publishers,
                             client1d.subscribers,
                             function(){},
                             client1d.description,
                             client1d.metadata);
    var client2 = new Client(client2d.name,
                             client2d.publishers,
                             client2d.subscribers,
                             function(){},
                             client2d.description,
                             client2d.metadata);
    var client1_copy = new Client(client1d.name,
                                  client1d.publishers,
                                  client1d.subscribers,
                                  function(){},
                                  client1d.description,
                                  client1d.metadata);
    client1d.uuid = client1.uuid;
    client2d.uuid = client2.uuid;

    beforeEach(function(){
      sb = new Spacebrew();
      expect(sb.addClient(client1)).to.be.true;
      expect(sb.addClient(client2)).to.be.true;
    });
    it('getClients() should return an array of clients that have been added',
      function() {
        expect(sb.getClients()).
          to.deep.equal([client1d, client2d]);
      }
    );
    it('getClients() should not include any clients which have been removed',
      function(){
        expect(sb.removeClient(client2)).to.be.true;
        expect(sb.getClients()).
          to.deep.equal([client1d]);
        expect(sb.removeClient(client1_copy)).to.be.true;
        expect(sb.getClients()).to.deep.equal([]);
      }
    );
    it('getClients() should not add any clients which already exist',
      function(){
        expect(sb.addClient(client1)).to.be.false;
        expect(sb.getClients()).to.deep.equal([client1d, client2d]);
      }
    );
    it('getClients() should not add any clients which are too similar',
      function(){
        expect(sb.addClient(client1_copy)).to.be.false;
        expect(sb.getClients()).to.deep.equal([client1d, client2d]);
      }
    );
    it('removeClient() should not remove any clients if there is no match',
      function(){
        expect(sb.removeClient(client1d)).to.be.true;
        expect(sb.removeClient(client1d)).to.be.false;
        expect(sb.getClients()).to.deep.equal([client2d]);
        expect(sb.removeClient(client2d)).to.be.true;
        expect(sb.removeClient(client2d)).to.be.false;
        expect(sb.getClients()).to.deep.equal([]);
      }
    );
  });
});
