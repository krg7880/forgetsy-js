var redis = require('redis');
var NOOP = function() {
  var args = arguments;
  console.log(args);
};

module.exports = {
  get: function() {
  	var client = redis.createClient();
  	client.on('error', NOOP)
	  .on('connect', NOOP);
    return client;
  }
};