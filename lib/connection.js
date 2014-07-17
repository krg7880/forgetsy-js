var redis = require('redis');
var client = redis.createClient();
client.on('error', NOOP)
	  .on('connect', NOOP);
var NOOP = function() {};

module.exports = {
  get: function() {
    return client;
  }
};