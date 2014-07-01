var Delta = require(__dirname + '/lib/delta');
var moment = require('moment');

var delta = 'shares';
var bin = 'my-content-id';

function getDays(days) {
  return (new Date().getTime() + ((60 * 60 * 24 * 1000) * days));
}

function createAndIncrement(cb) {
  Delta.create({
    name: delta
    ,time: getDays(7)
  }, function(e, delta) {
    if (e) return console.log('Error creating delta', e);

    // increment a new bin
    delta.incr({
      bin: bin
      ,by: 1
    }, function(e) {
      if (e) return console.log('Error incrementing bin', e);
      cb();
    })
  });
}

function fetch() {
  Delta.get(delta, function(e, delta) {
    if (e) return console.log('Delta does not exists', e);

    delta.fetch({date: getDays(1)}, function(e, trends) {
      if (e) return console.log('Error fetching all trends in ' + delta);
      console.log('Trends', trends);
    })
  })
}

createAndIncrement(fetch);
//fetch();