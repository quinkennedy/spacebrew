var Route = require('../route.js');
var Leaf = require('../leaf.js');
var Data = function(){
  this.route1 = {style:Route.styles.STRING,
                 type:'string',
                 from:{name:'client1',
                       endpoint:'pub1_1',
                       metadata:{}},
                 to:{name:'client2',
                     endpoint:'sub2_1',
                     metadata:{}}};
  this.route2 = {style:Route.styles.STRING,
                 type:'string',
                 from:{name:'client2',
                       endpoint:'pub2_1',
                       metadata:{}},
                 to:{name:'client1',
                     endpoint:'sub1_1',
                     metadata:{}}};
  this.stringRoute = {style:Route.styles.STRING,
                      type:'type',
                      from:{name:'client1',
                            endpoint:'pub1',
                            metadata:{}},
                      to:{name:'client2',
                          endpoint:'sub1',
                          metadata:{}}};
  this.regexpRoute = {style:Route.styles.REGEXP,
                      type:/type/,
                      from:{name:/client1/,
                            endpoint:/pub1/,
                            metadata:[]},
                      to:{name:/client2/,
                          endpoint:/sub1/,
                          metadata:[]}};
  this.uuidRoute = {style:Route.styles.UUID,
                    type:'type',
                    from:{uuid:'client1-uuid',
                          endpoint:'pub1'},
                    to:{uuid:'client2-uuid',
                        endpoint:'sub1'}};
  this.client1 = {name:'client1',
                  publishers:[],
                  subscribers:[],
                  description:'test client',
                  metadata:{}};
  this.client2 = {name:'client2',
                  publishers:[],
                  subscribers:[],
                  description:'test client',
                  metadata:{}};
  this.clientWithEndpoints1 = {name:'client1',
                               publishers:[{name:'pub1_1',
                                            type:'string'}],
                               subscribers:[{name:'sub1_1',
                                             type:'string'}],
                               description:'test client',
                               metadata:{}};
  this.clientWithEndpoints2 = {name:'client2',
                               publishers:[{name:'pub2_1',
                                            type:'string'}],
                               subscribers:[{name:'sub2_1',
                                             type:'string'}],
                               description:'test client',
                               metadata:{}};
};

Data.initRoute = function(data){
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

Data.initClient = function(data, callback){
  callback = callback || function(){};
  return new Leaf(data.name,
                  data.subscribers,
                  data.publishers,
                  callback,
                  data.description,
                  data.metadata);
};

module.exports = Data;
