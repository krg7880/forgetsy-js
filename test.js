var Delta = require(__dirname + '/lib/delta');
var moment = require('moment');

var category = 'shares';
var bin = 'video';

Delta.create({
  name: category
  ,time: moment().week()
}, function(e, delta) {
  delta.foo = 'bar';
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