var path = require('path');
var Promise = require('bluebird');
var utils = require(path.resolve(__dirname + '/utils'));
var client = null;
var LAST_DECAY_KEY = '_last_decay';
var LIFETIME_KEY = '_t';
var HI_PASS_FILTER = 0.0001;

var Set = function(key) {
  if (!this instanceof Set) {
    return new Set(key);
  }
  this.key = key;
};

Set.prototype.fetch = function(options) {
  return new Promise(function(resolve, reject) {
    var o = options || {};
    var limit = o.limit;
    var self = this;

    var run = function() {
      if (o.bin) {
        client.zscore([self.key, o.bin], function(e, res) {
          if (e) return reject(e);
          resolve(res);
        });
      } else {
        self.fetchRaw(o)
          .then(resolve)
          .catch(reject);
      }
    };

    if (o.scrub && o.decay) {
      this.scrubAndDecay(o)
        .then(run)
        .catch(reject);
    } else if (o.scrub) {
      this.scrub()
        .then(run)
        .catch(reject);
    } else if (o.decay) {
      this.decay(o)
        .then(run)
        .catch(reject);
    } else {
      run();
    }
  }.bind(this));
};

Set.prototype.scrubAndDecay = function(options) {
  return new Promise(function(resolve, reject) {
    var o = options;
    this.scrub()
      .bind(this)
      .then(this.decay)
      .then(resolve)
      .catch(reject);
  }.bind(this));
};

Set.prototype.execDecay = function(_delta, _set) {
  return new Promise(function(resolve, reject) {
    var delta = _delta;
    var set = _set;

    this.getLifetime()
      .bind(this)
      .then(function onLifetimeKey(lifetime) {
        var rate = 1 / parseInt(lifetime, 10);
        var multi = client.multi();
        var v = 0;

        for (var i=0; i<set.length; i++) {
          v = set[i].score * Math.exp(-delta * rate);
          multi.zadd(this.key, v, set[i].name);
        }

        multi.exec(function(e, replies) {
          this.updateDecayDate(new Date().getTime())
            .then(function onUpdateDecayDate(res) {
              resolve(res);
            })
            .catch(reject)
        }.bind(this));
      })
      .catch(reject);
  }.bind(this));
};

Set.prototype.decay = function(options) {
  return new Promise(function decayPromise(resolve, reject) {
    var o = options || {};

    this.getLastDecayDate()
      .bind(this)
      .then(function onLastDecayDateComplete(lastDecayDate) {
        var nextDecayDate = o.date || new Date().getTime();
        var delta = nextDecayDate - lastDecayDate;

        this.fetchRaw(o)
          .bind(this)
          .then(function onFetchRaw(set) {
            this.execDecay(delta, set)
              .bind(this)
              .then(resolve)
              .catch(reject);
          })
          .catch(function onFetchRawError(e) {
            reject(e);
          });
      });
  }.bind(this));
};

Set.prototype.getLifetime = function(cb) {
  return client.zscoreAsync([this.key, LIFETIME_KEY]);
};

Set.prototype.scrub = function() {
  return client.zremrangebyscoreAsync([this.key, '-inf', HI_PASS_FILTER]);
};

Set.prototype.getLastDecayDate = function(cb) {
  return new Promise(function getLastDecayPromise(resolve, reject) {
    return client.zscoreAsync([this.key, LAST_DECAY_KEY])
      .bind(this)
      .then(function onGetLastDecayDateComplete(date) {
        resolve(parseInt(date, 10));
      })
      .catch(reject);
  }.bind(this))
};

Set.prototype.fetchRaw = function(options) {
  return new Promise(function fetchRawPromise(resolve, reject) {
    var o = options || {};

    var limit = o.limit || -1;
    var bufferedLimit = limit;
    var self = this;

    if (limit > 0) {
      bufferedLimit += (this.specialKeys().length - 1);
    }

    client.zrevrangeAsync(this.key, 0, bufferedLimit, 'withscores')
      .bind(this)
      .then(function onComplete(set) {
        set = utils.filter(set, this.specialKeysObj());
        resolve(set);
      })
      .catch(reject);
  }.bind(this)); 
};

Set.prototype.updateDecayDate = function(date, key) {
  return client.zaddAsync([this.key, date, LAST_DECAY_KEY]);
};

/**
Increments a bin by n amount.

@param {Object} options {
  date: <last increment date>
  by: <increment by n>
  bin: <bin to increment>
}
@return Promise
*/
Set.prototype.incr = function(options) {
  return new Promise(function incrPromise(resolve, reject) {
    var o = options || {};
    var date = o.date || new Date().getTime();

    this.isValidIncrDate(date)
      .bind(this)
      .then(client.zincrbyAsync([this.key, o.by, o.bin]))
      .then(resolve)
      .catch(reject);
  }.bind(this));
};

Set.prototype.isValidIncrDate = function(date) {
  return new Promise(function isValidIncrDatePromise(resolve, reject) {
    var _date = date;
    this.getLastDecayDate()
      .bind(this)
      .then(function onGetLastDecayDateComplete(lastDecayDate) {
        if (date < lastDecayDate) {
          return reject(new Error('Invalid increment date specified!'));
        }

        resolve();
      })
      .catch(reject);
  }.bind(this));
};

Set.prototype.specialKeys = function() {
  return [LIFETIME_KEY, LAST_DECAY_KEY];
};

Set.prototype.specialKeysObj = function() {
  return {'_t': 1, '_last_decay': 1};
};

Set.prototype.createLifetimeKey = function(date, cb) {
  return client.zaddAsync([this.key, date, LIFETIME_KEY]);
};

/**
# @param float opts[time] : mean lifetime of an observation (secs).
# @param datetime opts[date] : a manual date to start decaying from.
*/
exports.create = function(options) {
  return new Promise(function createPromise(resolve, reject) {
    var o = options;

    if (typeof o !== typeof {}) return reject(new Error('Invalid options!'));

    if (!o.time) return reject(new Error('Invalid mean lifetime specified!'));

    if (!o.key) return reject(new Error('Invalid set key specified'));

    var date = o.date || new Date().getTime();
    var set = new Set(o.key);

    set.updateDecayDate(date)
      .then(function onUpdateDecayDate() {
        set.createLifetimeKey(o.time)
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
};

exports.get = function(name) {
  return new Set(name);
};

exports.setRedisClient = function(_client) {
  client = _client;
};

exports.Set = Set;