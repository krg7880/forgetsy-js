var Set = require(__dirname + '/set');
var connection = require(__dirname + '/connection');
var client = connection.get();
var NORM_T_MULT = 2;
var Delta = function(name) {
  if (!this instanceof Delta) {
    return new Delta(name);
  }

  this.name = name;
};

Delta.prototype.init = function(o, cb) {
  if (!o.time) {
    return cb(new Error('Missing required argument: o.time'));
  }

  var self = this;
  var secondaryDate = Date.now() - ((Date.now() - o.date) * NORM_T_MULT);
  Set.create({
    key: this.getPrimaryKey()
    ,time: o.time
    ,date: o.date
  }, function(e, res) {
    if (e) {
      return cb(e);
    }

    Set.create({
      key: self.getSecondaryKey()
      ,time: o.time * NORM_T_MULT
      ,date: secondaryDate
    }, function(e, res) {
      cb(e, res);
    })
  });
};

Delta.prototype.doFetch = function(o, cb) {
  var self = this;
  var primarySet = this.getSet(o.primary);
  if (!primarySet) return cb(new Error('Unable to initialize primary Set!'));

  var secondarySet = this.getSet(o.secondary);
  if (!secondarySet) return cb(new Error('Unable to initialize secondary Set!'));

  primarySet.fetch(o, function(e, count) {
    if (e) return cb(e);

    secondarySet.fetch(o, function(e, norm) {
      if (e) return cb(e);

      cb(null, {count: count, norm: norm});
    });
  });
};

Delta.prototype.fetch = function(o, cb) {
  o = o || {};
  o.decay = (typeof o.decay === 'undefined') ? true : ((o.decay) ? true : false);
  o.scrub = (typeof o.scrub === 'undefined') ? true : ((o.scrub) ? true : false);

  var limit = o.limit || -1;
  o.limit = void 0;

  o.bin = o.bin || null;
  var count = 0;
  var norm = 0;
  var result = null;
  var self = this;

  var fetchOpts = {
    primary: this.getPrimaryKey()
    ,secondary: this.getSecondaryKey()
    ,bin: o.bin
    ,scrub: o.scrub
    ,decay: o.decay
  };

  self.doFetch(fetchOpts, function(e, res) {
    if (e) {
      return cb(e);
    }

    if (!o.bin) {
      var norm = res.norm;
      var count = res.count;
      var results = {};
      var value = null;
      var norm_v = null;
      var count_v = null;
      for (var i in count) {
        norm_v = parseFloat(norm[i]);
        count_v = parseFloat(count[i]);
        value = (typeof norm_v === 'undefined') ? 0 : count_v / norm_v;
        results[i] = value; 
      }

      cb(null, results);
    } else {
      var primary = parseFloat(res.norm);
      var secondary = parseFloat(res.count);
      var results = {};
      if (!primary) {
        results[o.bin] = null;
      } else {
        var score = secondary / primary;
        results[o.bin] = score;
      }

      cb(null, results);
    }
  });
};

Delta.prototype.getPrimaryKey = function() {
  return this.name;
};

Delta.prototype.getSecondaryKey = function() {
  return this.name + '_2t';
};

Delta.prototype.incr = function(o, cb) {
  var sets = this.getSets();
  var count = -1;
  o.by = o.by || 1;
  var len = sets.length;

  var run = function() {
    if (++count < len) {
      sets[count].incr(o, function(e, res) {
        if (e) {
          return cb(e)
        }

        run();
      })
    } else {
      cb(null)
    }
  };

  run();
};

Delta.prototype.exists = function(name, cb) {
  client.exists(name, cb);
};

Delta.prototype.getSet = function(key) {
  return Set.get(key);
};

Delta.prototype.getSets = function() {
  return [this.getSet(this.getPrimaryKey()), this.getSet(this.getSecondaryKey())];
};

exports.create = function(o, cb) {
  if (!o.name) {
    return cb(new Error('Missing distribution name'));
  }

  if (!o.time) {
    return cb(new Error('Missing mean lifetime'));
  }

  o.date = o.date || Date.now();
  var delta = new Delta(o.name);
  delta.init(o, function(e) {
    if (e) {
      return cb(e);
    }

    cb(null, delta);
  });
};

exports.get = function(name, cb) {
  var delta = new Delta(name);
  delta.exists(name, function(e, exists) {
    if (!exists || e) {
      return cb(new Error('Delta does not exists'))
    }

    cb(null, delta);
  });
};