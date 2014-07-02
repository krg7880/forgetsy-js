forgetsy-js
===========

Nodejs fork of https://github.com/cavvia/forgetsy temporal trending library. This is still work in progress and needs proper testing and still undergoing heavy development. If you discover an issue, please open a ticket to have it resolved or fork and fix :-) The project use Redis as the backend. 

Please fork and make it better.

#### Installation
npm install forgetsy-js

#### Import Delta

```javascript
var Delta = require('forgetsy-js').Delta;
```

#### Define delta to create
```javascript
var dist = 'shares';
var bin = 'my-content-id';
```

##### Create, increment and fetch the trends 
```javascript
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
```

#### Example output
```json
{ 
	itemTwo: 0.999999999997154
	, itemOne: 0.9999999999939523 
}
```

#### Simple test
npm test

##### Simple Benchmark
Iterations: 10,000

Operations: create, increment, fetch

real        0m9.556s

user        0m5.831s

sys        0m3.689s
