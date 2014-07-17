var redis = require('redis');
var client = redis.createClient();
var NOOP = function() {};

module.exports = {
  get: function() {
  	client.on('error', NOOP)
	  .on('connect', NOOP);
    return client;
  }
};