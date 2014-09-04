var Delta = require('../index');
var path = require('path');
var Promise = require('bluebird');

var redis = require('fakeredis');

var chai = require('chai');
var expect = chai.expect;

var client = redis.createClient();
Delta.setRedisClient(client);

var dist = 'facebook-shares';
var bin = 'my-content-id'

function getDays(days) {
  return (new Date().getTime() + ((60 * 60 * 24 * 1000) * days));
}

describe('testing delta', function() {
  it('should be a valid delta instance', function(done) {
    Delta.create({
      name: dist
      ,time: getDays(14)
    })
    .then(function onCreateComplete(delta) {
      done();
    })
    .catch(function onCreateError(e) {
      console.log(e)
    })
  });

  it('should return a valid dist', function(done) {
    Delta.get(dist)
      .then(function onGetComplete(delta) {
        done();
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should increment a bin in the distribution', function(done) {
    Delta.get(dist)
      .then(function onGetComplete(delta) {
        delta.incr({
          bin: bin
          ,by: 1
        })
          .then(function(res) {
            done();
          })
          .catch(function(e) {
            console.log(e)
          });
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should fetch all items in distribution', function(done) {
    Delta.get(dist)
      .then(function onGetComplete(delta) {
        delta.fetch().then(function(results) {
          done()
        })
        .catch(function(e) {
          
        })
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })
});