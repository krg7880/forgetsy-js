forgetsy-js
===========

Nodejs fork of https://github.com/cavvia/forgetsy temporal trending framework. This is still work in progress and needs proper testing and still undergoing heavy development. If you discover an issue, please open a ticket to have it resolved or fork and fix :-) The long term goal is to create a RESTFul API. The project use Redis as the backend. 

Please fork and make it better.

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
