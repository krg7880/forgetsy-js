'use strict';

var redis = require('redis');
var client = redis.createClient();

client.on('error', function() {})
	.on('connect', function() {})

module.exports = {
	get: function() {
		return client;
	}
};