/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Leaf = require('../leaf.js');
var Route = require('../route.js');
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
  describe('cleanSubscribers', function(){
    it('return an empty array if an array is not passed in',
       function() {
         cleanEndpointsEmptyTests(Leaf.cleanSubscribers);
       }
    );
  });
  describe('cleanPublishers', function(){
    it('return an empty array if an array is not passed in',
       function(){
         cleanEndpointsEmptyTests(Leaf.cleanPublishers);
       }
    );
  });
  describe('verifyFunction', function(){
    it('throw exception if function is not provided',
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
    it('return supplied function',
       function(){
         var f = function(){};
         expect(Leaf.verifyFunction(f)).to.equal(f);
       }
    );
  });
  describe('cleanMetadata', function(){
    it('return an empty object if an object is not passed in',
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
    it('discard values that are not numbers and strings',
       function(){
         expect(Leaf.cleanMetadata({f:function(){}})).to.deep.equal({});
         expect(Leaf.cleanMetadata({a:[]})).to.deep.equal({});
         expect(Leaf.cleanMetadata({n:null})).to.deep.equal({});
         expect(Leaf.cleanMetadata({u:undefined})).to.deep.equal({});
         expect(Leaf.cleanMetadata({o:{}})).to.deep.equal({});
         expect(Leaf.cleanMetadata({})).to.deep.equal({});
       }
    );
    it('keep values that are numbers or strings',
       function(){
         var metadata = {s:'string'};
         expect(Leaf.cleanMetadata(metadata)).to.deep.equal(metadata);
         var metadata2 = {n:1};
         expect(Leaf.cleanMetadata(metadata2)).to.deep.equal(metadata2);
       }
    );
    it('handle multi-key objects',
       function(){
         expect(Leaf.cleanMetadata({a:[1, 2],
                                    o:{a:1, b:2}})).to.deep.equal({});
         expect(Leaf.cleanMetadata({n:1, s:'string'})).
           to.deep.equal({n:1, s:'string'});
         expect(Leaf.cleanMetadata({a:[], n:1})).to.deep.equal({n:1});
         expect(Leaf.cleanMetadata({o:{a:1, b:2},
                                    n:1,
                                    u:undefined,
                                    s:'anotherstring',
                                    a:['a', 'b', 'c']})).
           to.deep.equal({n:1, s:'anotherstring'});
       }
    );
  });
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
  it('test duplicate routes',
     function(){
       var leaf1 = D.initClient(d.clientWithEndpoints1);
       var leaf2 = D.initClient(d.clientWithEndpoints2);
       //create the same route via String and UUID method
       var route1 = new Route(Route.styles.STRING,
                              'type',
                              {name:'client1',
                               metadata:{}},
                              'pub1_1',
                              {name:'client2',
                               metadata:{}},
                              'sub2_1');
       var route2 = new Route(Route.styles.UUID,
                              'type',
                              leaf1.uuid,
                              'pub1_1',
                              leaf2.uuid,
                              'sub2_1');

       //add both routes to publisher
       leaf1.addOutConnection(leaf1.publishers[0],
                              leaf2,
                              leaf2.subscribers[0],
                              route1);
       leaf1.addOutConnection(leaf1.publishers[0],
                              leaf2,
                              leaf2.subscribers[0],
                              route2);
       //ensure only one connection encapsulates both routes
       expect(leaf1.publishers[0].connectedTo).to.have.length(1);
       expect(leaf1.publishers[0].connectedTo[0].routes).to.have.length(2);

       //add both routes to subscriber
       leaf2.addInConnection(leaf1,
                             leaf1.publishers[0],
                             leaf2.subscribers[0],
                             route1);
       leaf2.addInConnection(leaf1,
                             leaf1.publishers[0],
                             leaf2.subscribers[0],
                             route2);
       //ensure only one connection encapsulates both routes
       expect(leaf2.subscribers[0].connectedTo).to.have.length(1);
       expect(leaf2.subscribers[0].connectedTo[0].routes).to.have.length(2);
     }
   );
   it('test multiple unique routes',
      function(){
        var leaf1 = D.initClient(d.clientWithEndpoints1);
        var leaf2 = D.initClient(d.clientWithEndpoints2);
        var route1 = new Route(Route.styles.UUID,
                               'type',
                               leaf1.uuid,
                               'pub1_1',
                               leaf1.uuid,
                               'sub1_1');
        var route2 = new Route(Route.styles.UUID,
                               'type',
                               leaf1.uuid,
                               'pub1_1',
                               leaf2.uuid,
                               'sub2_1');
        var route3 = new Route(Route.styles.UUID,
                               'type',
                               leaf2.uuid,
                               'pub2_1',
                               leaf2.uuid,
                               'sub2_1');

        //add both routes to pub1_1
        leaf1.addOutConnection(leaf1.publishers[0],
                               leaf1,
                               leaf1.subscribers[0],
                               route1);
        leaf1.addOutConnection(leaf1.publishers[0],
                               leaf2,
                               leaf2.subscribers[0],
                               route2);
        //ensure there are two separate connections each with one route
        expect(leaf1.publishers[0].connectedTo).to.have.length(2);
        expect(leaf1.publishers[0].connectedTo[0].routes).to.have.length(1);
        expect(leaf1.publishers[0].connectedTo[1].routes).to.have.length(1);

        //add both routes to sub2_1
        leaf2.addInConnection(leaf1,
                              leaf1.publishers[0],
                              leaf2.subscribers[0],
                              route2);
        leaf2.addInConnection(leaf2,
                              leaf2.publishers[0],
                              leaf2.subscribers[0],
                              route3);
        //ensure there are two separate connections each with one route
        expect(leaf2.subscribers[0].connectedTo).to.have.length(2);
        expect(leaf2.subscribers[0].connectedTo[0].routes).to.have.length(1);
        expect(leaf2.subscribers[0].connectedTo[1].routes).to.have.length(1);
      }
    );
});
