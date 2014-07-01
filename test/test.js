var path = require('path');
var Delta = require(path.resolve('lib/delta'));

var dist = 'shares';
var bin = 'test';

// @todo - integrate convenient date lib
function getDays(days) {
  return (new Date().getTime() + ((60 * 60 * 24 * 1000) * days));
}

function createAndIncrement(cb) {
  Delta.create({
    name: dist
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

function fetchAll() {
  Delta.get(dist, function(e, delta) {
    if (e) return console.log('Delta does not exists', e);

    delta.fetch({date: getDays(1)}, function(e, trends) {
      if (e) return console.log('Error fetching all trends in ' + dist);
      process.exit()
    });
  });
}

function fetchOne() {
  Delta.get(dist, function(e, delta) {
    if (e) return console.log('Delta does not exists', e);

    delta.fetch({bin: 'test', date: getDays(1)}, function(e, trends) {
      if (e) return console.log('Error fetching all trends in ' + dist);
      console.log('Trends', trends);
    });
  });
}

createAndIncrement(fetchAll);

// fetches the trending content
//fetch();