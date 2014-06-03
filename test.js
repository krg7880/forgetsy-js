var Delta = require('./delta2');
var time = require('./time');
var when = require('when');
var start = new Date().getTime();
var max = 1;
var count = 0;

function fetch() {
  when(Delta.fetch('member'))
    .then(function(delta) {
      when(delta.fetch({date: time.day()}))
        .then(function(users) {
          
          console.log('users', users, 'end');
          if (++count >= max) {
            console.log('end', (new Date().getTime() - start).toString());
          }
        }).otherwise(function(e) {
          console.log('error fetching users', e);
        });
    }).otherwise(function(e) {
      console.log('Error fetching delta');
    });
};

function run() {
  when(Delta.create({name: 'member', time: time.day()}))
  .then(function(delta) {

    // fetch the member delta
    when(Delta.fetch('member'))
      .then(function(delta) {
        when(delta.incr({bin: 'Kirk', by: 1}))
          .then(function() {
            fetch();
          }).otherwise(function(e) {
            console.log('Error incrementing user');
          })
      }).otherwise(function(e) {
        console.log('Error fetching delta', e);
      });

  }).otherwise(function(e) {
    console.log('Delta Error', e);
  });
}

for (var i=0; i<max; i++) {
  fetch();
}