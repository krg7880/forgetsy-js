var Delta = require('./delta2');
var time = require('./lib/time');
var when = require('when');
var max = 1;
var count = 0;
var category = 'shares';
var start;

function fetch() {
  var promise = when(Delta.fetch(category));

  promise.then(function(delta) {
    var fetchPromise = when(delta.fetch({date: time.week()}));

    fetchPromise.then(function(trends) {
      if (++count >= max) 
        console.log('Trending', trends, 'test completed in ', (new Date().getTime() - start) + 'ms');
    });

    fetchPromise.otherwise(function(e) {
      console.log('Error getting trends', e);
    })
  });

  promise.otherwise(function(e) {
    console.log('Error fetching member');
  });
};

function run() {
  var promise = when(Delta.create({
    name: category
    ,time: time.week()
  }));

  promise.then(function(delta) {
    var promise = when(delta.incr({
      bin: 'Train'
      ,by: 1
    }));

    promise.then(function() {
      fetch();
    });

    promise.otherwise(function(e) {
      console.log('error', e)
    });
  });
};

start = new Date().getTime();
for (var i=0; i<max; i++) {
  fetch();
}