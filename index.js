'use strict';

var Delta = require('./delta');
var connection = require('./connection');
var client = connection.get();
var time = require('./time');
var when = require('when');
/*
var onCreate = function() {
  when(Delta.fetch({name: 'followers'}))
    .then(onFetch)
    .otherwise(onFetchFailed);
};

var onCreateFailed = function(e) {
  console.log('Failed to create delta', e);
};

var onFetch = function(delta) {
  console.log('Got delta');
  when(delta.incr({
    name: 'User'
    ,date: time.week()
  })).then(onIncr).otherwise(onIncrFailed);

};

var onFetchFailed = function(e) {
  console.log('Failed to fetch delta', e);
}

var onIncr = function() {
  console.log('onIncr', arguments);
};

var onIncrFailed = function(e) {
  console.log('Incr failed', e);
};

when(Delta.create({
  name: 'followers'
  ,time: time.week()
})).then(onCreate).otherwise(onCreateFailed);
*/
client.on('connect', function() {
  client.zrevrange('follows', 0, -1, 'withscores', function(e, res) {
  console.log(e, res);
});
})