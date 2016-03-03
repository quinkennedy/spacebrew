/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Route = require('../route.js');
var D = require('./data.js');
var d = new D();

describe('Route', function(){
  describe('Constructing', function(){
    it('you can define a route with strings',
      function(){
        expect(new Route(Route.styles.STRING,
                         'type',
                          {name:'client1',
                           metadata:{}},
                          'pub1',
                          {name:'client2',
                           metadata:{}},
                          'sub1')).to.be.instanceof(Route);
      }
    );
    it('you can define a route with uuid\'s',
      function(){
        expect(new Route(Route.styles.UUID,
                         'type',
                         'client1-uuid',
                         'pub1',
                         'client2-uuid',
                         'sub1')).to.be.instanceof(Route);
      }
    );
    it('you can define a route with regular expressions',
      function(){
        expect(new Route(Route.styles.REGEXP,
                         /type/,
                         {name:/client1/,
                          metadata:[]},
                         /pub1/,
                         {name:/client2/,
                          metadata:[]},
                         /sub1/)).to.be.instanceof(Route);
      }
    );
    it('but you have to use something in Route.styles.list',
      function(){
        expect(Route.bind(Route, 'rando',
                                 'type',
                                 'client1',
                                 'pub1',
                                 'client2',
                                 'sub1')).
          to.throw('style argument must be one of '+Route.styles.join(', '));
      }
    );
    //TODO: test metadata:[{key:RegExp, value:RegExp}]
    it('have to use all RegExp objects if you declare regex',
      function(){
        var formatArgs = 
          function(style, type, pubName, pubEndpoint, subName, subEndpoint){
            return [style, 
                    type, 
                    {name:pubName, metadata:[]}, 
                    pubEndpoint, 
                    {name:subName, metadata:[]}, 
                    subEndpoint];
          };
        var testArgs = [Route.styles.REGEXP, 
                        /type/, 
                        /client1/, 
                        /pub1/, 
                        /client2/, 
                        /sub1/];
        var applyToRoute = function(args){
          Route.apply(this, args);
        };
        for(var i = 1; i < testArgs.length; i++){
          var currArgs = [];
          for(var j = 0; j < testArgs.length; j++){
            currArgs.push(j === i ? testArgs[j].toString() : testArgs[j]);
          }
          var formattedArgs = formatArgs.apply(this, currArgs);
          expect(applyToRoute.bind(Route, formattedArgs)).
            to.throw('type, fromId.name, publisherName, ' + 
                     'toId.name, and subscriberName must all ' +
                     'be RegExp objects when style is regexp');
        }
      }
    );
    it('have to use all String objects if you declare string style',
      function(){
        var formatArgs = 
          function(style, type, pubName, pubEndpoint, subName, subEndpoint){
            return [style, 
                    type, 
                    {name:pubName, metadata:{}}, 
                    pubEndpoint, 
                    {name:subName, metadata:{}}, 
                    subEndpoint];
          };
        var testArgs = [Route.styles.STRING, 
                        'type', 
                        'client1', 
                        'pub1', 
                        'client2', 
                        'sub1'];
        var applyToRoute = function(args){
          Route.apply(this, args);
        };
        for(var i = 1; i < testArgs.length; i++){
          var currArgs = [];
          for(var j = 0; j < testArgs.length; j++){
            currArgs.push(j === i ? new RegExp(testArgs[j]) : testArgs[j]);
          }
          var formattedArgs = formatArgs.apply(this, currArgs);
          expect(applyToRoute.bind(Route, formattedArgs)).
            to.throw('type, fromId.name, publisherName, ' +
                     'toId.name, and subscriberName must ' + 
                     'all be strings when style is string');
        }
      }
    );
    it('can\'t use maps to identify clients when using UUID style.',
      function(){
        expect(Route.bind(Route, Route.styles.UUID,
                                 'string',
                                 {name:'client1',
                                  metadata:{}},
                                 'pub1',
                                 'client2-uuid',
                                 'sub1')).
          to.throw('fromId must be a UUID string because style is uuid');
      }
    );
    //TODO: REGEXP requires metadata Arrays
  });
  describe('route/route matching', function(){
    var stringRoute = D.initRoute(d.stringRoute);

    it('match a route using an Object where all the information matches',
      function(){
        expect(stringRoute.matches(d.stringRoute)).to.be.true;
      }
    );
    it('match a route using only the UUID', function(){
      expect(stringRoute.matches(stringRoute.uuid)).to.be.true;
    });
    it('doesn\'t match when the data is wrong', function(){
      expect(stringRoute.matches(d.regexpRoute)).to.be.false;
    });
  });
  //TODO: test toMap
  describe('regexp utilities', function(){
    describe('getBackref', function(){
      //signature Route.getBackref(matchArray)
      it('returns only the array of backreferences', function(){
        expect(Route.getBackref(/(ll)/.exec('hello'))).
          to.deep.equal(['ll']);
        expect(Route.getBackref(/h(e)(.*)o/.exec('hello'))).
          to.deep.equal(['e','ll']);
        expect(Route.getBackref(/(l)(.*)(l)/.exec('hello'))).
          to.deep.equal(['l','','l']);
      });
      it('returns an empty array if nothing is passed in', function(){
        var match = /w/.exec('hello');
        expect(match).to.be.null;
        expect(Route.getBackref(match)).to.deep.equal([]);
      });
      it('returns an empty array if there are no captured groups',
        function(){
          var match = /h/.exec('hello');
          expect(match).to.have.lengthOf(1);
          expect(Route.getBackref(match)).to.deep.equal([]);
        }
      );
    });
    describe('subBackref', function(){
      //signature Route.subBackref(backref, regexp)
      it('returns a matching RegExp if there are no captured groups',
        function(){
          expect(Route.subBackref([], /\1/).toString()).
            to.equal(/\1/.toString());
        }
      );
      it('returns a matching RegExp if there are no backreferences',
        function(){
          expect(Route.subBackref(['hey','ho'], /ll/).toString()).
            to.equal(/ll/.toString());
        }
      );
      it('replaces the backreferences based on the captured groups',
        function(){
          expect(Route.subBackref(['hey','ho'],/\1\2/).toString()).
            to.equal(/heyho/.toString());
          expect(Route.subBackref(['hey','ho'],/\1\2\1/).toString()).
            to.equal(/heyhohey/.toString());
        }
      );
      it('replaces matched backreferences, and decrements unmatched ones',
        function(){
          expect(Route.subBackref(['hey','ho'],/\3/).toString()).
            to.equal(/\1/.toString());
        }
      );
    });
    describe('matchRegexpChain', function(){
      //signature Route.matchRegexpChain(regexp, string)
      var regexps, strings;
      it('matches in-order', function(){
        regexps = [/hi/,/bye/];
        strings = ['hi','bye'];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
      });
      it('fails if there is a mis-match at any point', function(){
        regexps = [/hi/,/bye/];
        strings = ['hi','nooo'];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.false;
        regexps = [/hi/,/bye/];
        strings = ['nooo', 'bye'];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.false;
      });
      it('passes if arrays are empty', function(){
        regexps = [];
        strings = [];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
      });
      it('fails if arrays are different lengths', function(){
        regexps = [/hi/];
        strings = [];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.false;
        regexps = [];
        strings = ['hi'];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.false;
      });
      it('backreferences use capture groups from earlier in the chain',
        function(){
          regexps = [/(hi)/,/\1/];
          strings = ['hi','hi'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
          regexps = [/(.*)i/,/\1ello/];
          strings = ['hi','hello'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
          regexps = [/^(.)/, /^\1/];
          strings = ['hi','hello'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
          strings = ['pie','pillow'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
          strings = ['trick','majic'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.false;
          regexps = [/(.*)i/,/\1e(.)\2o/];
          strings = ['hi','hello'];
          expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
        }
      );
      it('capture groups append as you go down the chain', function(){
        regexps = [/^(.)/,/^(.)/,/^\1.*\s\2/];
        strings = ['pie', 'fail', 'pillow fight'];
        expect(Route.matchRegexpChain(regexps, strings)).to.be.true;
      });
    });
    describe('metadataRegexpMatch', function(){
      //signature Route.metadataRegexpMatch(mRegexp, mClient)
      var mreEmpty = [];
      var mreAll = [{key:/.*/, value:/.*/}];
      var mreIP = [{key:/^ip$/, value:/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/}];
      var mreMulti = [{key:/hi/, value:/bye/}, {key:/red/, value:/blue/}];
      it('only empty regexp matches empty metadata', function(){
        expect(Route.metadataRegexpMatch(mreEmpty, {})).to.be.true;
        expect(Route.metadataRegexpMatch(mreEmpty, {a:'a'})).to.be.false;
        expect(Route.metadataRegexpMatch(mreAll, {})).to.be.false;
      });
      it('.* RegExp matches non-empty metadata',
        function(){
          expect(Route.metadataRegexpMatch(mreAll, {hi:'bye'})).to.be.true;
          expect(Route.metadataRegexpMatch(mreAll, {hi:'bye', one:'two'})).
            to.be.true;
          expect(Route.metadataRegexpMatch(mreAll, {})).to.be.false;
        }
      );
      it('all metadata entries must match some RegExp', function(){
        expect(Route.metadataRegexpMatch(mreIP, {ip:'127.0.0.1'})).
          to.be.true;
        expect(Route.metadataRegexpMatch(mreIP, {ip:'127.0.0.1', id:5})).
          to.be.false;
        expect(Route.metadataRegexpMatch(mreIP, {})).to.be.false;
        expect(Route.metadataRegexpMatch(mreIP, {ip:'localhost'})).
          to.be.false;
      });
      it('all Regular Expressions must be matched', function(){
        expect(Route.metadataRegexpMatch(mreMulti, {hi:'bye', red:'blue'})).
          to.be.true;
        expect(Route.metadataRegexpMatch(mreMulti, {hi:'bye'})).
          to.be.false;
        expect(Route.metadataRegexpMatch(mreMulti, {hi:'bye', 
                                                    red:'blue', 
                                                    one:'two'})).
          to.be.false;
      });
      it('backreference from value to capture groups in key',function(){
        var mreRef = [{key:/^(.)/, value:/^\1/}];
        expect(Route.metadataRegexpMatch(mreRef, {hi:'hello'})).to.be.true;
        expect(Route.metadataRegexpMatch(mreRef, {hi:'bye'})).to.be.false;
        expect(Route.metadataRegexpMatch(mreRef, {hi:'hello', pie:'pillow'})).
          to.be.true;
      });
      it('backreference should also reference capture groups in value',
        function(){
          var mreRef2 = [{key:/^(.)/, value:/^\1.*(.)\s\2/}];
          expect(Route.metadataRegexpMatch(mreRef2, {pie:'pillow willow'})).
            to.be.true;
          expect(Route.metadataRegexpMatch(mreRef2, {pie:'pillow fight'})).
            to.be.false;
        }
      );
    });
  });
  describe('pub/sub matching', function(){
    var route1 = D.initRoute(d.route1);
    var client1 = D.initClient(d.clientWithEndpoints1);
    var client2 = D.initClient(d.clientWithEndpoints2);
    describe('matchesFromClient', function(){
    //signature: matchesFromClient(pubClient)
      it('true if the client matches the "from" definition', function(){
        expect(route1.matchesFromClient(client1)).to.be.true;
        expect(route1.matchesFromClient(client2)).to.be.false;
      });
    });
    describe('matchesPublisher', function(){
      //signature: matchesPublisher(pubClient, publisher)
      it('true when all match', function(){
        expect(route1.matchesPublisher(client1, client1.publishers[0])).
          to.be.true;
        expect(route1.matchesPublisher(client2, client2.publishers[0])).
          to.be.false;
      });
      it('client and publisher must match', function(){
        expect(route1.matchesPublisher(client1, client2.publishers[0])).
          to.be.false;
        expect(route1.matchesPublisher(client2, client1.publishers[0])).
          to.be.false;
      });
    });
    describe('matchesPubToClient', function(){
      //signature: matchesPubToClient(pubClient, publisher, subClient);
      it('true when all match', function(){
        expect(route1.matchesPubToClient(client1, client1.publishers[0], 
                                         client2)).
          to.be.true;
        expect(route1.matchesPubToClient(client2, client2.publishers[0], 
                                         client1)).
          to.be.false;
      });
      it('false if any one doesn\'t match its particular role', function(){
        expect(route1.matchesPubToClient(client2, client1.publishers[0], 
                                         client2)).
          to.be.false;
        expect(route1.matchesPubToClient(client1, client2.publishers[0], 
                                         client2)).
          to.be.false;
        expect(route1.matchesPubToClient(client1, client1.publishers[0], 
                                         client1)).
          to.be.false;
      });
    });
    describe('matchesPair', function(){
      //signature: matchesPair(pubClient, publisher, subClient, subscriber);
      it('true when all match', function(){
        expect(route1.matchesPair(client1, client1.publishers[0],
                                  client2, client2.subscribers[0])).to.be.true;
        expect(route1.matchesPair(client2, client2.publishers[0],
                                  client1, client1.subscribers[0])).to.be.false;
      });
      it('false if any param doesn\'t match its particular role', function(){
        expect(route1.matchesPair(client2, client1.publishers[0],
                                  client2, client2.subscribers[0])).to.be.false;
        expect(route1.matchesPair(client1, client2.publishers[0],
                                  client2, client2.subscribers[0])).to.be.false;
        expect(route1.matchesPair(client1, client1.publishers[0],
                                  client1, client2.subscribers[0])).to.be.false;
        expect(route1.matchesPair(client1, client1.publishers[0],
                                  client2, client1.subscribers[0])).to.be.false;
      });
    });
  });
});
