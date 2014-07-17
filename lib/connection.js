var redis = require('redis');
var client = redis.createClient();
var NOOP = function() {};
client.on('error', NOOP)
	  .on('connect', NOOP);

module.exports = {
  get: function() {
    return client;
  }
};