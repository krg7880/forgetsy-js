var Delta = require('./delta2');
var time = require('./time');
var when = require('when');
when(Delta.create({name: 'member', time: time.day()}))
  .then(function(delta) {

    // fetch the member delta
    when(Delta.fetch('member'))
      .then(function(delta) {

        when(delta.incr({bin: 'User'}))
          .then(function() {
            when(delta.fetch({date: time.day()}))
              .then(function(users) {
                
                console.log('users', users);
              }).otherwise(function(e) {
                console.log('error fetching users', e);
              })
          }).otherwise(function(e) {
            console.log('Error incrementing user');
          })
      }).otherwise(function(e) {
        console.log('Error fetching delta', e);
      });

  }).otherwise(function(e) {
    console.log('Delta Error', e);
  })