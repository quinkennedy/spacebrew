/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Leaf = require('../leaf.js');
var D = require('./data.js');
var d = new D();

var cleanEndpointsEmptyTests = function(cleanFunc){
      expect(cleanFunc()).to.deep.equal([]);
      expect(cleanFunc(undefined)).to.deep.equal([]); 
      expect(cleanFunc(null)).to.deep.equal([]);
      expect(cleanFunc(1)).to.deep.equal([]);
      expect(cleanFunc('hi')).to.deep.equal([]);
      expect(cleanFunc({})).to.deep.equal([]);
      expect(cleanFunc({name:'sub', type:'string'})).to.deep.equal([]);
      expect(cleanFunc([])).to.deep.equal([]);
      expect(cleanFunc({1:{name:'stub', type:'string'}})).to.deep.equal([]);
};

describe('Leaf', function(){
  it('cleanSubscribers should return an empty array if an array is not passed in',
    function() {
      cleanEndpointsEmptyTests(Leaf.cleanSubscribers);
    }
  );
  it('cleanPublishers should return an empty array if an array is not passed in',
    function(){
      cleanEndpointsEmptyTests(Leaf.cleanPublishers);
    }
  );
  it('verifyFunction should throw exception if function is not provided',
    function(){
      var msg = 'callback must be a function';
      expect(Leaf.verifyFunction.bind(this)).to.throw(msg);
      expect(Leaf.verifyFunction.bind(this, null)).to.throw(msg);
      expect(Leaf.verifyFunction.bind(this, undefined)).to.throw(msg);
      expect(Leaf.verifyFunction.bind(this, 1)).to.throw(msg);
      expect(Leaf.verifyFunction.bind(this, 'hi')).to.throw(msg);
      expect(Leaf.verifyFunction.bind(this, [])).to.throw(msg);
    }
  );
  it('verifyFunction should return supplied function',
    function(){
      var f = function(){};
      expect(Leaf.verifyFunction(f)).to.equal(f);
    }
  );
  it('cleanMetadata should return an empty object if an object is not passed in',
    function(){
      expect(Leaf.cleanMetadata()).to.deep.equal({});
      expect(Leaf.cleanMetadata(null)).to.deep.equal({});
      expect(Leaf.cleanMetadata(undefined)).to.deep.equal({});
      expect(Leaf.cleanMetadata(1)).to.deep.equal({});
      expect(Leaf.cleanMetadata('hi')).to.deep.equal({});
      expect(Leaf.cleanMetadata(function(){})).to.deep.equal({});
      expect(Leaf.cleanMetadata([])).to.deep.equal({});
    }
  );
  it('cleanMetadata should discard values that are not numbers and strings',
    function(){
      expect(Leaf.cleanMetadata({f:function(){}})).to.deep.equal({});
      expect(Leaf.cleanMetadata({a:[]})).to.deep.equal({});
      expect(Leaf.cleanMetadata({n:null})).to.deep.equal({});
      expect(Leaf.cleanMetadata({u:undefined})).to.deep.equal({});
      expect(Leaf.cleanMetadata({o:{}})).to.deep.equal({});
      expect(Leaf.cleanMetadata({})).to.deep.equal({});
    }
  );
  it('cleanMetadata should keep values that are numbers or strings',
    function(){
      var metadata = {s:'string'};
      expect(Leaf.cleanMetadata(metadata)).to.deep.equal(metadata);
      var metadata2 = {n:1};
      expect(Leaf.cleanMetadata(metadata2)).to.deep.equal(metadata2);
    }
  );
  it('cleanMetadata should handle multi-key objects',
    function(){
      expect(Leaf.cleanMetadata({a:[1, 2], o:{a:1, b:2}})).to.deep.equal({});
      expect(Leaf.cleanMetadata({n:1, s:'string'})).to.deep.equal({n:1, s:'string'});
      expect(Leaf.cleanMetadata({a:[], n:1})).to.deep.equal({n:1});
      expect(Leaf.cleanMetadata({o:{a:1, b:2}, n:1, u:undefined, s:'anotherstring', a:['a', 'b', 'c']})).to.deep.equal({n:1, s:'anotherstring'});
    }
  );
  it('test matches',
    function(){
      var leaf = D.initClient(d.client1);
      expect(leaf.matches(d.client1)).to.be.true;
      expect(leaf.matches(leaf.uuid)).to.be.true;
      expect(leaf.matches(leaf)).to.be.true;
      expect(leaf.matches({name:d.client1.name, 
                           metadata:d.client1.metadata})).
        to.be.true;
      expect(leaf.matches({name:'bogus', 
                           metadata:d.client1.metadata})).
        to.be.false;
      expect(leaf.matches(d.client1.name)).to.be.false;
    }
  );
});
