var path = require('path');
var connection = require(path.resolve(__dirname + '/connection'));
var client = connection.get();
var utils = require(path.resolve(__dirname + '/utils'));

var LAST_DECAY_KEY = '_last_decay';
var LIFETIME_KEY = '_t';
var HI_PASS_FILTER = 0.0001;


var Set = function(key) {
  if (!this instanceof Set) {
    return new Set(key);
  }
  this.key = key;
};

Set.prototype.fetch = function(o, cb) {
  o = o || {};

  var limit = o.limit;
  var self = this;

  var run = function() {
    if (o.bin) {
      client.zscore([self.key, o.bin], cb);
    } else {
      self.fetchRaw(o, cb);
    }
  }
  if (o.scrub && o.decay) {
    this.scrubAndDecay(o,run);
  } else if (o.scrub) {
    this.scrub(run);
  } else if (o.decay) {
    this.decay(o, run);
  } else {
    run();
  }
};

Set.prototype.scrubAndDecay = function(o, cb) {
  var self = this;
  self.scrub(function(e, res) {
    if (e) {
      return cb(e);
    } 

    self.decay(o, cb);
  })
};

Set.prototype.decay = function(o, cb) {
  o = o || {};
  var t1 = o.date || new Date().getTime();
  var rate = null;
  var self = this;

  self.getLastDecayDate(function(e, date) {
    if (e) {
      return cb(e);
    }

    var t0 = date;
    var delta = t1 - t0;
    self.fetchRaw(o, function(e, set) {
      if (e) {
        return cb(e);
      }

      self.getLifetime(function(e, lifetime) {
        var rate = 1 / lifetime;
        var multi = client.multi();
        var v = 0;
        for (var i in set) {
          v = set[i] * Math.exp(-delta * rate);
          multi.zadd(self.key, v, i);
        }

        multi.exec(function(e, replies) {
          if (e) {
            return cb(e);
          }

          self.updateDecayDate(new Date().getTime(), cb);
        })
      });
    });
  });
};

Set.prototype.getLifetime = function(cb) {
  client.zscore([this.key, LIFETIME_KEY], cb);
};

Set.prototype.scrub = function(cb) {
  client.zremrangebyscore([this.key, '-inf', HI_PASS_FILTER], cb);
};

Set.prototype.getLastDecayDate = function(cb) {
  client.zscore([this.key, LAST_DECAY_KEY], function(e, res) {
    if (e) {
      return cb(e);
    }

    cb(null, parseInt(res, 10));
  });
};

Set.prototype.fetchRaw = function(o, cb) {
  o = o || {};

  var limit = o.limit || -1;
  var bufferedLimit = limit;
  var self = this;

  if (limit > 0) {
    bufferedLimit += (this.specialKeys().length - 1);
  }

  client.zrevrange(this.key, 0, bufferedLimit, 'withscores', function(e, set) {
    if (e) {
      return cb(e, null);
    }

    set = utils.arrayToObject(set);
    set = self.filterSpecialKeys(set);

    cb(null, set);
  })
};

Set.prototype.updateDecayDate = function(date, cb) {
  client.zadd([this.key, date, LAST_DECAY_KEY], cb);
};

Set.prototype.incr = function(o, cb) {
  o = o || {};
  var date = o.date || new Date().getTime();
  var self = this;

  self.isValidIncrDate(date, function(e) {
    if (e) {
      return cb(e, null);
    }

    var cmd = [self.key, o.by, o.bin];
    client.zincrby(cmd, cb);
  });
};

Set.prototype.isValidIncrDate = function(date, cb) {
  this.getLastDecayDate(function(e, lastDecayDate) {
    if (e) {
      return cb(e, null);
    }

    if (date < lastDecayDate) {
      return cb(new Error('Invalid increment date!'));
    }

    cb(null);
  });
};

/**
The special keys are always at the beginning of the
set. Let's remove those.
@param {Object} set Trending set
*/
Set.prototype.filterSpecialKeys = function(set) {
  var specialKeys = this.specialKeys();
  var len = specialKeys.length;

  for (var i=0; i<len; i++) {
    if (set[specialKeys[i]]) {
      delete set[specialKeys[i]];
    }
  }

  return set;
};

Set.prototype.specialKeys = function() {
  return [LIFETIME_KEY, LAST_DECAY_KEY];
};

Set.prototype.createLifetimeKey = function(date, cb) {
  client.zadd([this.key, date, LIFETIME_KEY], cb);
};


/**
# @param float opts[time] : mean lifetime of an observation (secs).
# @param datetime opts[date] : a manual date to start decaying from.
*/
exports.create = function(o, cb) {
  if (!o['time']) {
    return cb(new Error('Missing required options: o.time'));
  }

  var date = o['date'] || new Date().getTime();
  var set = new Set(o.key);
  set.updateDecayDate(date, function(e) {
    if (e) {
      return cb(e);
    }

    set.createLifetimeKey(o.time, cb);
  });
};

exports.get = function(name) {
  return new Set(name);
};