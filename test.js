var Delta = require(__dirname + '/lib/delta');
var time = require(__dirname + '/lib/time');
var Datejs = require('datejs');

console.log(Datejs.today())

//var count = 2;  
var category = 'shares';
var bin = 'video';

Delta.create({
  name: category
  ,time: time.week()
}, function(e, delta) {
  // increment a new bin
  delta.incr({
    bin: bin
    ,by: 1
  }, function(e) {
    // fetch all item
    delta.fetch({
      date: time.week()
    }, function(e, trends) {
      console.log('trends', trends);
    })
  })
});