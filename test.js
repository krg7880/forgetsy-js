var Promise = require('es6-promise').Promise;
var connection = require('./lib/connection');
var client = connection.get();
var Delta = require('./lib/delta');
var time = require('./lib/time');
var start;
var max = 100;
var count = 0;
var category = 'member';
var bin = 'Camp';

function fetch() {
  var promise = Delta.fetch(category);

  promise.then(function(delta) {
    var trending = delta.fetch();
    trending.then(function(trends) {
      if (++count >= max) {
        console.log('Trending', trends, 'test completed in ', (new Date().getTime() - start) + 'ms');
      }
    })
  })

  return Delta.fetch(category)
    .then(function(delta) {
      return delta.fetch().then(function(trends) {
        if (++count >= max) {
          console.log('end', (new Date().getTime() - start).toString(), trends);
          process.exit();
        }
      }).catch(function(e) {
        console.log('Error fetching trends', e);
      })
    }).catch(function(e) {
      console.log('Error fetching category', e);
    });
};

function run() {
  var promise = Delta.create({
    name: category
    ,time: time.week()
  });

  promise.then(function(delta) {
    var promise = delta.incr({
      bin: bin
      ,by: 1
    });

    promise.then(fetch);
    promise.catch(function(e) {
      console.log('Increment error', e);
    })
  });

  promise.catch(function(e) {
    console.log('Create error');
  })
};

start = new Date().getTime();
for (var i=0; i<max; i++) {
  fetch();
}
