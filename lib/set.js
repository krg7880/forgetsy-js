var connection = require('./connection');
var client = connection.get();
var Promise = require('es6-promise').Promise;

function arrayToObject(arr) {
  var tmp = {};
  var len = arr.length;
  for (var i=0; i<len; i++) {
    if ((i % 2) == 0) {
      tmp[arr[i]] = arr[++i];
    }
  }

  return tmp;
}

var Set = function(key) {
  this.key = key;
  this.last_decayed_key = '_last_decay';
  this.lifetime_key = '_t';
  this.hi_pass_filter = 0.0001;
};

Set.prototype.fetch = function(opts) {
  var limit = opts.limit || -1;
  var self = this;
  var run = function() {
    if (opts.bin) {
      return client.zscoreAsync([self.key, opts.bin]);
    } else {
      return self.fetchRaw({limit: limit});
    }
  };

  if (opts.decay) {
    return this.decay(opts)
      .then(function() {
        if (opts.scrub) {
          return self.scrub(opts)
            .then(function() {
              return run();
            });
        } else {
          return run();
        }
      });
  } else {
    return run();
  }
};

function multiExec(key, lastDecayDate, set, lifetime, date) {
  var t0 = lastDecayDate;
  var t1 = date || Date.now();
  var delta = t1 - t0;
  var rate = 1 / lifetime;
  var multi = client.multi();

  for (var i in set) {
    var v = set[i] * Math.exp(-delta * rate);
    multi.zadd(key, v, i);
  }

  return new Promise(function(resolve, reject) {
    multi.exec(function(e, replies) {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });
};

Set.prototype.decay = function(opts) {
  opts = opts || {};
  var self = this;
  return this.getLastDecayDate()
    .then(function(lastDecayDate) {
      return self.fetchRaw()
        .then(function(set) {
          return self.getLifetime()
            .then(function(lifetime){
              return multiExec(self.key, lastDecayDate, set, lifetime, opts.date)
                .then(function() {
                  return self.updateDecayDate(Date.now());
                });             
            });
        });
    });
};

Set.prototype.getLifetime = function() {
  return client.zscoreAsync([this.key, this.lifetime_key]);
};

Set.prototype.scrub = function() {
  return client.zremrangebyscoreAsync([this.key, '-inf', this.hi_pass_filter]);
};

Set.prototype.getLastDecayDate = function() {
  return client.zscoreAsync([this.key, this.last_decayed_key])
    .then(function(date) {
      return parseInt(date, 10);
    });
};

Set.prototype.fetchRaw = function(opts) {
  opts = opts || {};
  var bufferedLimit = limit = opts.limit || -1  

  if (limit > 0) {
    bufferedLimit += this.specialKeys().length;
  }

  var self = this;

  return client.zrevrangeAsync([this.key, 0, bufferedLimit, 'withscores'])
    .then(function(set) {
      return new Promise(function(resolve, reject) {
        if (set.length <= 0) {
          reject(new Error('No record found!'));
        } else {
          set = arrayToObject(set);
          set = self.filterSpecialKeys(set);
          resolve(set);
        }
      });
    });
};

Set.prototype.updateDecayDate = function(date) {
  return client.zaddAsync([this.key, date, this.last_decayed_key])
};

Set.prototype.incr = function(opts) {
  var date = opts.date || Date.now();
  var self = this;
  opts.by = opts.by || 1;
  return this.isValidIncrDate(date).then(function() {
    return client.zincrbyAsync([self.key, opts.by, opts.bin]);
  });
};

Set.prototype.isValidIncrDate = function(date) {
  return this.getLastDecayDate()
    .then(function(lastDecayDate) {
      return new Promise(function(resolve, reject) {
          if (date > lastDecayDate) {
            resolve(lastDecayDate);
          } else {
            reject(new Error('Invalid increment date!'));
          }
      });
    });
};

Set.prototype.specialKeys = function() {
  return [this.lifetime_key, this.last_decayed_key];
};

Set.prototype.createLifetimeKey = function(date) {
  return client.zaddAsync([this.key, date, this.lifetime_key]);
};

exports.create = function(opts) {
  if (!opts['time']) {
    throw new Error('Missing required option: object.time');
  }

  var date = opts['date'] || Date.now();
  var set = new Set(opts.key);
  return set.updateDecayDate(date).then(function() {
    return set.createLifetimeKey(opts.time).then(function(lifetimeKey) {
      return new Promise(function(resolve, reject) {
        resolve(set);
      });
    })
  });
};

Set.prototype.filterSpecialKeys = function(set, limit) {
  var newSet = {};
  var specialKeys = this.specialKeys();
  var keys = Object.keys(set);

  for (var i=0; i<specialKeys.length; i++) {
    if (set[specialKeys[i]]) {
      delete set[specialKeys[i]];
    }
  }

  return set;
};

exports.fetch = function(name) {
  return new Promise(function(resolve) {
    resolve(new Set(name));
  });
};

var set = exports.fetch('follows');