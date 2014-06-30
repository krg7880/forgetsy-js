forgetsy-js
===========

Nodejs fork of https://github.com/cavvia/forgetsy temporial trending framework. This is still work in progress and needs proper testing. Please fork and make it better.

```
var Delta = require(__dirname + '/lib/delta');
var moment = require('moment');

var category = 'shares';
var bin = 'video';

Delta.create({
  name: category
  ,time: moment().week()
}, function(e, delta) {
  console.log(e);
  // increment a new bin
  delta.incr({
    bin: bin
    ,by: 1
  }, function(e) {
    // fetch all item
    delta.fetch({
    }, function(e, trends) {
      console.log('trends', trends);
    })
  })
});
```
