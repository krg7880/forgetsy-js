forgetsy-js
===========

Nodejs fork of https://github.com/cavvia/forgetsy temporal trending library. This is still work in progress and needs proper testing and still undergoing heavy development. If you discover an issue, please open a ticket to have it resolved or fork and fix :-) The project use Redis as the backend. 

Please fork and make it better.

#### Import Delta

```javascript
var Delta = require(__dirname + '/lib/delta');
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

function fetch() {
  Delta.get(dist, function(e, delta) {
    if (e) return console.log('Delta does not exists', e);

    delta.fetch({date: getDays(1)}, function(e, trends) {
      if (e) return console.log('Error fetching all trends in ' + dist);
      console.log('Trends', trends);
    })
  })
}

// create a delta and a bin
createAndIncrement(fetch);

// fetches the trending content
//fetch();
```
