let Delta = require(__dirname + '/delta');
let time = require(__dirname + '/time');

//let count = 2;  
let category = 'shares';

let increment = function(delta) {
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

let i=0;

let delta = null;

let get = function(cb) {
  /*delta.fetch({
    bin: 'kirk'
  }, function(e, res) {

    console.log('res', res)
    cb()
  });*/
  Delta.get(category, function(e, delta) {
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
  });
};

let create = function() {
  Delta.create({
    name: category
    ,time: time.week()
  }, function(e, delta) {

  });
};

let max = 10000;
let count = 0;
let run = function() {
  get(function() {
    if (++count >= max) {
      process.exit();
    } else {
      run();
    }
  })
}

//run();

Delta.get(category, function(e, _delta) {
  delta = _delta;
  for (let i=0; i<max; i++) {
    get(function() {
      if (i >= max) {
        process.exit();
      }
    });
  }
})