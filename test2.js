var Delta = require('./delta2');
var time = require('./lib/time');
var when = require('when');
var max = 10000;
var count = 0;
var category = 'shares';
var start;

function fetch() {
  when(Delta.fetch(category))
    .then(function(delta) {
      when(delta.fetch({date: time.week()}))
        .then(function(trends) {
          console.log('Fetch', trends);
          if (++count >= max) 
            console.log('kirk', trends, 'test completed in ', (new Date().getTime() - start) + 'ms');
            process.exit();
        }).otherwise(function(e) {
        console.log('Error getting trends', e);
      });
    }).otherwise(function(e) {
    console.log('Error fetching member');
  });
};

function run() {
  when(Delta.create({
    name: category
    ,time: time.week()
  })).then(function(delta) {
    when(delta.incr({
      bin: 'kirk'
      ,by: 1
    })).then(function() {
      fetch();
    }).otherwise(function(e) {
      console.log('error', e)
    });
  }).otherwise(function(e) {
    console.log('create error', e);
  })
};

start = new Date().getTime();
for (var i=0; i<max; i++) {
  fetch();
}