var redis = require('redis');
var client = redis.createClient();
var NOOP = function() {
  var args = arguments;
  console.log(args);
};

client.on('error', NOOP)
  .on('connect', NOOP);

module.exports = {
  get: function() {
    return redis.createClient()
  }
};