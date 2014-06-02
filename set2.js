var when = require('when');
var connection = require('./connection');
var client = connection.get();

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

var Set = function(name) {
  this.name = name;
  this.last_decayed_key = '_last_decay';
  this.lifetime_key = '_t';
  this.hi_pass_filter = 0.0001;
};

Set.prototype.fetch = function(opts) {
  var d = when.defer();
  var limit = opts.limit || -1;
  var decay = opts.decay || true;
  var scrub = opts.scrub || true;

  if (opts.bin) {
    client.zscore([this.name, opts.bin], function(e, res) {
      if (e) {
        d.reject(e);
      } else {
        d.resolve(res);
      }
    });
  } else {
    when(this.fetchRaw({limit: limit}))
      .then(d.resolve)
      .otherwise(d.reject);
  }

  return d.promise;
};

Set.prototype.decay = function() {
  var d = d.when();
  var t0 = null;
  var t1 = opts.date || Date.now();
  var delta = t1 - t0;
  var set = this.fetch_raw();
  var rate = null;
  var self = this;

  when(this.getLastDecayDate())
    then(function(date) {
      // set the delta
      t0 = date;
      delta = t1 - t0;

      // get the set
      when(self.fetchRaw())
        .then(function(set) {
          
          // get the lifetime
          when(self.getLifetime())
            .then(function(lifetime) {
              rate = 1 / lifetime;

              var multi = client.multi();
              var cmds = [];

              set.forEach(function(k, v) {
                var new_v = v * Math.exp(-delta * rate);
                multi.zadd(self.name, new_v, k);
              });

              multi.exec(function(e, replies) {
                if (e) {
                  d.reject(e);
                } else {

                  when(self.updateDecayDate(Date.now()))
                    .then(d.resolve)
                    .otherwise(d.reject);
                }
              });
            }).otherwise(function(e) {
              d.reject(e);
            })
        }).otherwise(function(e) {
          d.reject(e);
        })
    })
    .otherwise(function(e) {
      d.reject(e);
    })

  return d.promise;
};

Set.prototype.getLifetime = function() {
  var d = when.defer();
  client.zscore([this.name, this.lifetime_key], function(e, lifetime) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(lifetime);
    }
  });
  return d.promise;
};

Set.prototype.scrub = function() {
  var d = when.defer();
  client.zremrangebyscore([this.name, '-inf', this.hi_pass_filter], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });

  return d.promise; 
};

Set.prototype.getLastDecayDate = function() {
  var d = when.defer();
  client.zscore([this.name, this.last_decayed_key], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });
  return d.promise();
};

Set.prototype.fetchRaw = function(opts) {
  var d = when.defer();
  opts = opts || {};
  var limit = opts.limit || -1;
  var bufferedLimit = limit;
  var self = this;

  if (limit > 0) {
    bufferedLimit += this.specialKeys().length;
  }

  client.zrevrange(this.name, 0, bufferedLimit, 'withscores', function(e, set) {
    if (e) {
      d.reject(e);
    } else {
      set = arrayToObject(set);
      set = self.filterSpecialKeys(set);
      d.resolve(set);
    }
  });

  return d.promise;
};

Set.prototype.updateDecayDate = function(date) {
  var d = when.defer();
  client.zadd([this.name, date, this.last_decayed_key], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });
  return d.promise;
};

Set.prototype.specialKeys = function() {
  return [this.lifetime_key, this.last_decayed_key];
};

/**
# @param float opts[time] : mean lifetime of an observation (secs).
# @param datetime opts[date] : a manual date to start decaying from.
*/
exports.create = function(opts) {
  if (!opts['time']) {
    throw new Error('Missing required option: object.time');
  }

  var date = opts['date'] || Date.now();
  var set = new Set(opts.name);
  when(set.updateDecayDate(date))
    .then(function() {
      set.createLifetimeKey(opts.time);
    }).otherwise(function(e) {
      console.log('create error');
    });
};

/**
Need to understand better what's going on
here in Ruby
*/
Set.prototype.filterSpecialKeys = function(set, limit) {
  var newSet = {};
  var specialKeys = this.specialKeys();
  var keys = Object.keys(set);

  for (var i=0; i<keys.length; i++) {
    if (specialKeys[keys[i]]) {
      delete set[i];
    } 
  }

  return set;
  // need to return the results
};

exports.fetch = function(name) {
  return new Set(name);
};

var set = exports.fetch('follows');
var start = new Date().getTime();
var max = 1
var count = 0;
var check = function(i) {
  if (++count >= max) {
    console.log('End time ', (new Date().getTime() - start) );
  }
}

// run a test

when(set.fetch({})).then(function(users) {
  console.log('users', users);
  check();
}).otherwise(function(e) {
  console.log('Error', e);
  count();
});