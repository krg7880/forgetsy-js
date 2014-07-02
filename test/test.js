var path = require('path');
var Delta = require(path.resolve('lib/delta'));

var dist = 'twitter';
var bin = 'itemTwo';

// @todo - integrate convenient date lib
function getDays(days) {
  return (new Date().getTime() + ((60 * 60 * 24 * 1000) * days));
}

// increment an index -- do this on a view/share/follow, for example
function increment(cb) {
  Delta.get(dist, function(e, delta) {
    if (e) return console.log('Error fetching delta', e);
    // increment a new bin
    delta.incr({
      bin: bin
      ,by: 1
    }, function(e) {
      if (e) return console.log('Error incrementing bin', e);
      cb();
    });
  });
}

// create a new delta
function create(cb) {
  Delta.create({
    name: dist
    ,time: getDays(14)
  }, function(e, delta) {
    if (e) return console.log('Error creating delta', e);

    increment(cb);
  });
}

// fetch all trending items
function fetchAll() {
  Delta.get(dist, function(e, delta) {
    if (e) return console.log('Delta does not exists', e);

    delta.fetch({date: getDays(1)}, function(e, trends) {
      if (e) return console.log('Error fetching all trends in ' + dist);
      console.log(trends);
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

create(fetchAll);

// fetches a single index
//fetchOne();