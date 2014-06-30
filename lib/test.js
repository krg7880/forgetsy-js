var Delta = require(__dirname + '/delta');
var time = require(__dirname + '/time');

//var count = 2;  
var category = 'shares';

var increment = function(delta) {
  delta.incr({
    bin: 'kirk'
    ,by: 1
  }, function(e) {
    delta.fetch({
      date: time.week()
    }, function(e, res) {
      console.log(res);
    })
  });
};

var get = function(cb) {
  Delta.get(category, function(e, delta) {
    (function(delta) {
      console.log('Delta!', delta.uuid);
      delta.fetch({
        bin: 'Train'
      }, function(e, res) {
        console.log(res);
        delta.incr({
          bin: 'Train'
          ,by: 1
        }, function(e) {
          delta.fetch({
            date: time.week()
          }, function(e, res) {
            console.log('increment', res);
            cb();
          })
        });
      });
    })(delta);
  });
};

var create = function() {
  Delta.create({
    name: category
    ,time: time.week()
  }, function(e, delta) {

  });
};

var max = 10000;
var count = 0;
var run = function() {
  get(function() {
    if (++count >= max) {
      process.exit();
    } else {
      run();
    }
  })
}

//run();

//Delta.get(category, function(e, _delta) {
  //delta = _delta;
  for (var i=0; i<max; i++) {
    console.log(i, String(new Date().getTime()))
    //get(function() {
     // if (i >= max) {
     //   process.exit();
    //  }
    //});
  }
//})