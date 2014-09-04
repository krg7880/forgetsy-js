var delta = require('../index');
var path = require('path');
var Promise = require('bluebird');

var redis = require('fakeredis');

var chai = require('chai');
var expect = chai.expect;

var client = redis.createClient();

delta.setRedisClient(client);

var dist = 'facebook-shares';
var bin = 'my-content-id'
var bins = ['item one', 'item two', 'item three', 'item four'];

function getDays(days) {
  return (new Date().getTime() + ((60 * 60 * 24 * 1000) * days));
}

function increment(bin, cb) {
  delta.get(dist)
    .then(function onGetComplete(delta) {
      delta.incr({
        bin: bin
        ,by: 1
      })
        .then(function(res) {
          cb();
        })
        .catch(function(e) {
          console.log('Error', e)
        });
    })
    .catch(function onGetError(e) {
      console.log('Error', e);
    })
}

describe('testing delta', function() {
  it('should be a valid delta instance', function(done) {
    delta.create({
      name: dist
      ,time: getDays(14)
    })
    .then(function onCreateComplete(_delta) {
      expect(_delta instanceof delta.Delta).to.equal(true);
      done();
    })
    .catch(function onCreateError(e) {
      console.log(e)
    })
  });

  it('should return a valid dist', function(done) {
    delta.get(dist)
      .then(function onGetComplete(delta) {
        done();
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should increment a several bins in the distribution', function(done) {
    var count = 0;
    var run = function(idx) {
      if (idx < bins.length) {
        increment(bins[idx], function() {
          run(++count);
        });
      } else {
        done();
      }
    }

    run(0);
  })

  it('should fetch all items in distribution', function(done) {
    delta.get(dist)
      .then(function onGetComplete(delta) {
        delta.fetch().then(function(results) {
          expect(typeof results).to.equal(typeof {});
          expect(results.length).to.equal(4);
          done()
        })
        .catch(function(e) {
          console.log('Fetch error', e);
        })
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should fetch 2 items in distribution', function(done) {
    delta.get(dist)
      .then(function onGetComplete(delta) {
        delta.fetch({limit: 2}).then(function(results) {
          expect(typeof results).to.equal(typeof {});
          expect(results.length).to.equal(2);
          done()
        })
        .catch(function(e) {
          console.log('Fetch error', e);
        })
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should fetch a specific item in distribution', function(done) {
    delta.get(dist)
      .then(function onGetComplete(delta) {
        var bin = bins[Math.floor(Math.random()*bins.length)];
        delta.fetch({bin: bin}).then(function(results) {
          expect(results[0].item).to.equal(bin);
          expect(results.length).to.equal(1);
          done()
        })
        .catch(function(e) {
          console.log('Fetch error', e);
        })
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
  })

  it('should return the most trending item', function(done) {
    var bin = bins[2];
    increment(bin, function() {
      delta.get(dist)
      .then(function onGetComplete(delta) {
        delta.fetch({limit: 1}).then(function(results) {
          expect(typeof results).to.equal(typeof {});
          expect(results.length).to.equal(1);
          expect(results[0].item).to.equal(bin);
          done()
        })
        .catch(function(e) {
          console.log('Fetch error', e);
        })
      })
      .catch(function onGetError(e) {
        console.log(e);
      })
    });
  })
});