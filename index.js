'use strict';

var delta = require('./delta');
var time = require('./time');
var when = require('when');

when(delta.create({
	name: 'followers'
	,time: time.week()
})).then(function(delta) {
	console.log('res', delta);
	//delta.incr();
}).otherwise(function(e) {
	console.log('error', e);
});

//var followers = delta.create({name: 'followers', time: time.week()});