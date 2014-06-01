'use strict';

var redis = require('redis');
var client = redis.createClient();

client.on('error', function() {
	console.log('Connection Error!');
}).on('connect', function() {
	console.log('connected');
})

module.exports = {
	get: function() {
		return client;
	}
};