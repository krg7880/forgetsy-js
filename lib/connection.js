var redis = require('redis');
var client = redis.createClient();
var NOOP = function() {};

client
	.on('error', function() {
		console.log('Error connecting to redis');
	})
	.on('connect', function() {
		console.log('connected');
	});

module.exports = {
  get: function() {
    return client;
  }
};