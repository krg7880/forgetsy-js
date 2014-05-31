'use strict';

var redis = require('redis');
var client = redis.createClient();

client.on('error', function() {
	console.log('Connection Error!');
});

module.exports = {
	get: function() {
		return client;
	}
};