/* jshint expr: true, mocha: true */
var chai = require('chai');
var expect = chai.expect;
var Route = require('../route.js');

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
                          metadata:{}},
                         /pub1/,
                         {name:/client2/,
                          metadata:{}},
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
    it('have to use all RegExp objects if you declare regex',
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
            to.throw('type, fromId.name, publisherName, toId.name, and subscriberName must all be RegExp objects when style is regexp');
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
            to.throw('type, fromId.name, publisherName, toId.name, and subscriberName must all be strings when style is string');
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
  });
  it('matching', function(){
    var stringRouteD = {style:Route.styles.STRING,
                        type:'type',
                        from:{name:'client1',
                              endpoint:'pub1',
                              metadata:{}},
                        to:{name:'client2',
                            endpoint:'sub1',
                            metadata:{}}};
    var regexpRouteD = {style:Route.styles.REGEXP,
                        type:/type/,
                        from:{name:/client1/,
                              endpoint:/pub1/,
                              metadata:{}},
                        to:{name:/client2/,
                            endpoint:/sub1/,
                            metadata:{}}};
    var uuidRouteD = {style:Route.styles.UUID,
                        type:'type',
                        from:{uuid:'client1-uuid',
                              endpoint:'pub1'},
                        to:{uuid:'client2-uuid',
                            endpoint:'sub1'}};
    var createRoute = function(data){
      var from, to;
      if (data.style === Route.styles.UUID){
        from = data.from.uuid;
        to = data.to.uuid;
      } else {
        from = {name: data.from.name,
                metadata: data.from.metadata};
        to = {name: data.to.name,
              metadata: data.to.metadata};
      }
      return new Route(data.style,
                       data.type,
                       from,
                       data.from.endpoint,
                       to,
                       data.to.endpoint);
    };
    var stringRoute = createRoute(stringRouteD);
    var regexpRoute = createRoute(regexpRouteD);
    var uuidRoute = createRoute(uuidRouteD);

    stringRouteD.uuid = stringRoute.uuid;
    regexpRouteD.uuid = regexpRoute.uuid;
    uuidRouteD.uuid = uuidRoute.uuid;

    expect(stringRoute.matches(stringRouteD)).to.be.true;
    expect(stringRoute.matches(stringRoute.uuid)).to.be.true;
    expect(stringRoute.matches(regexpRouteD)).to.be.false;
  });
});
