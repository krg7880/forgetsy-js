var redis = require('redis');
var NOOP = function() {};

module.exports = {
  get: function() {
  	var client = redis.createClient();
  	client.on('error', NOOP)
	  .on('connect', NOOP);
    return client;
  }
};