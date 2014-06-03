'use strict';

var redis = require('redis');
var client = redis.createClient();
var Promise = require('bluebird');

client = Promise.promisifyAll(client);
client.on('error', function() {})
	.on('connect', function() {})

module.exports = {
	get: function() {
		return client;
	}
};