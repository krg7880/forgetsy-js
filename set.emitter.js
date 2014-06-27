var when = require('when');
var connection = require('./lib/connection');
var client = connection.get();
var EventEmitter = require('events').EventEmitter;
var util = require('util');

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


var Bin = function(key) {
  Bin.super_.call(this);
  this.key = key;
  this.last_decayed_key = '_last_decay';
  this.lifetime_key = '_t';
  this.hi_pass_filter = 0.0001;
};

util.inherits(Bin, EventEmitter);

Bin.prototype.fetch = function(options) {
  var limit = options.limit || -1;
  var self = this;

  this.on('decay_complete', function(evt) {
    self.scrub(options);
  }).on('scrub_complete', function(evt) {
    if (options.bin) {
      this.getBin({bin: options.bin});
    } else {
      this.getAll({limit: limit});
    }
  });

  this.decay(options);
};

Set.prototype.decay = function(opts) {
  if (!options.decay) {
    this.emit('decay_complete', {});
    return;
  } 
  
  opts = opts || {};
  var d = when.defer();
  var t0 = null;
  var t1 = opts.date || Date.now();
  var delta = t1 - t0;
  var rate = null;
  var self = this;

  when(this.getLastDecayDate())
    .then(function(date) {
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

              for (var i in set) {
                var v = set[i] * Math.exp(-delta * rate);
                multi.zadd(self.key, v, i);
              }

              multi.exec(function(e, replies) {
                if (e) {
                  d.reject(e);
                } else {
                  when(self.updateDecayDate(Date.now()))
                    .then(d.resolve)
                    .otherwise(d.reject);
                }
              });
            }).otherwise(d.reject);
        }).otherwise(d.reject);
    }).otherwise(d.reject);

  return d.promise;
};

Set.prototype.getLifetime = function() {
  var d = when.defer();
  client.zscore([this.key, this.lifetime_key], function(e, lifetime) {
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
  client.zremrangebyscore([this.key, '-inf', this.hi_pass_filter], function(e, res) {
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
  client.zscore([this.key, this.last_decayed_key], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(parseInt(res,10));
    }
  });
  return d.promise;
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

  client.zrevrange(this.key, 0, bufferedLimit, 'withscores', function(e, set) {
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
  client.zadd([this.key, date, this.last_decayed_key], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });
  return d.promise;
};

Set.prototype.incr = function(opts) {
  var d = when.defer();
  var date = opts.date || Date.now();
  var self = this;
  opts.by = opts.by || 1;
  when(this.isValidIncrDate(date))
    .then(function() {
      client.zincrby([self.key, 1, opts.bin], function(e, res) {
        if (e) {
          d.reject(e);
        } else {
          d.resolve(res);
        }
      });
    }).otherwise(function() {
      d.reject(new Error('Invalid increment date!'));
    });

  return d.promise;
};

Set.prototype.isValidIncrDate = function(date) {
  var d = when.defer();

  when(this.getLastDecayDate())
    .then(function(_date) {
      if (date > _date) {
        d.resolve()
      } else {
        d.reject()
      }
    }).otherwise(d.reject);

  return d.promise;
};

Set.prototype.specialKeys = function() {
  return [this.lifetime_key, this.last_decayed_key];
};

Set.prototype.createLifetimeKey = function(date) {
  var d = when.defer();
  client.zadd([this.key, date, this.lifetime_key], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });
  return d.promise;
};

/**
Need to understand better what's going on
here in Ruby
*/
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



var BinFactory = function() {
  BinFactory.super_.call(this);
};

util.inherits(BinFactory, EventEmitter);

/**
# @param float opts[time] : mean lifetime of an observation (secs).
# @param datetime opts[date] : a manual date to start decaying from.
*/
BinFactory.prototype.create = function(options) {
  if (!options.time) {
    self.emit('error', new Error('Missing mean lifetime: options.time'));
    return;
  } 

  var date = options.date || Date.now();
  var bin = new Bin(options.key);
  bin.on('decay_date_updated', function(evt) {
    bin.createLifetimeKey(options.time);
  }).on('create_lifetime_key', function(evt) {
    self.emit('create_complete');
  })
};

BinFactory.prototype.fetch = function(name) {
  return new Bin(name);
};

module.exports = BinFactory;