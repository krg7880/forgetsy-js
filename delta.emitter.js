var Promise = require('bluebird');
var Set = require('./set2');
var time = require('./lib/time');
var when = require('when');
var connection = require('./lib/connection');
var client = connection.get();
var NORM_T_MULT = 2;

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Delta = function(name) {
  Runner.super_.call(this);
  this.name = name;
};

util.inherits(Delta, EventEmitter);

Delta.prototype.init = function(opts) {
  if (!opts.time) {
    throw new Error('Missing time');
  }

  var self = this;
  var secondaryDate = Date.now() - ((Date.now() - opts.date) * NORM_T_MULT);

  var set = new Set();
  set.on('CREATE', function(evt) {
    self.emit('init', evt);
  });

  set.on('error', function(e) {
    self.emit('error', e);
  })

  set.create({
    key: this.getPrimaryKey()
    ,time: opts.time
    ,date: opts.date
  }).create({
    key: this.getPrimaryKey()
    ,time: opts.time
    ,date: opts.date
  });
};

Delta.prototype.doFetch = function(opts) {
  var d = when.defer();
  var self = this;

  when(this.getSet(opts.primary))
    .then(function(primarySet) {
      when(self.getSet(opts.secondary))
        .then(function(secondarySet) {
          when(primarySet.fetch(opts))
            .then(function(count) {
              when(secondarySet.fetch(opts))
                .then(function(norm) {
                  d.resolve({count: count, norm: norm});
                }).otherwise(d.reject);
            }).otherwise(function(e) {
              d.reject(e);
            });
        })
        .otherwise(d.reject);
    })
    .otherwise(function(e) {
      d.reject(e);
    });
  return d.promise;
};

Delta.prototype.fetch = function(opts) {
  opts = opts || {};
  opts.decay = (typeof opts.decay == 'undefined') ? true : false;
  opts.scrub = (typeof opts.scrub == 'undefined') ? true : false;

  var d = when.defer();
  var limit = opts.limit || -1;
  delete opts.limit;
  var bin = opts.bin || null;
  var count = 0;
  var norm = 0;
  var result = null;
  var self = this;

  var fetchOpts = {
    primary: this.getPrimaryKey()
    ,secondary: this.getSecondaryKey()
    ,bin: bin
    ,scrub: opts.scrub
    ,decay: opts.decay
  };

  if (!bin) {
    when(this.doFetch(fetchOpts)).then(function(res) {
      var norm = res.norm;
      var count = res.count;
      var value = 0;
      var results = [];
      for (var i in count) {
        var norm_v = norm[i];
        var value = (typeof norm_v === 'undefined') ? 0 : parseFloat(count[i]).toFixed(count[i].toString().length) / parseFloat(norm_v).toFixed(norm_v.toString().length);
        results[i] = parseFloat(value).toFixed(value.toString().length);
      }
      d.resolve(results);
    }).otherwise(d.reject);
  } else {
    
    var promise = when(this.doFetch(fetchOpts));
    
    promise.then(function(sets) {
      var primary = sets.norm;
      var secondary = sets.count;
      var results = {};
      if (!primary) {
        results[bin] = null
      } else {
        var score = parseFloat(secondary).toFixed(secondary.toString().length) / parseFloat(primary).toFixed(primary.toString().length);
        results[bin] = score;
      }

      d.resolve(results);
    });

    promise.otherwise(d.reject);
    /*
    when(this.doFetch(fetchOpts)).then(function(res) {
      var norm = res.norm;
      var count = res.count;
      var results = {};
      if (!norm) {
        results[bin] = null;
      } else {
        var norm_v = parseFloat(count) / parseFloat(norm).toFixed(2);
        results[bin] = norm_v;
      }
      d.resolve(results);
    }).otherwise(d.reject);
*/
  }

  return d.promise;
};

Delta.prototype.incr = function(opts) {
  var d = when.defer();
  when(this.getSets())
    .then(function(sets) {
      var errors = [];
      var count = 0;      
      var check = function() {
        if (++count >= sets.length) {
          if (errors.length > 0) {
            d.reject(errors);
          } else {
            d.resolve();
          }
        }
      };
      
      sets.forEach(function(set) {
        when(set.incr(opts))
          .then(function(){
            check();
          })
          .otherwise(function(e) {
            errors.push(e);
            check();
          })
      });
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.incr_by = function(opts) {
  var d = when.defer();
  when(this.getSets())
    .then(function(sets) {
      var errors = [];
      var count = 0;
      opts.by = opts.by || 1;
      var check = function() {
        if (++count >= sets.length) {
          if (errors.length > 0) {
            d.reject(errors);
          } else {
            d.resolve();
          }
        }
      };
      
      sets.forEach(function(i, set) {
        when(set.incr(opts))
          .then(function(){
            check();
          })
          .otherwise(function(e) {
            errors.push(e);
            check();
          })
      });
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.exists = function(name) {
  var d = when.defer();

  client.exists(name, function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });

  return d.promise;
};

Delta.prototype.getSet = function(key) {
  var d = when.defer();

  when(Set.fetch(key))
    .then(d.resolve)
    .otherwise(d.reject);

  return d.promise;
};

Delta.prototype.getSets = function() {
  var d = when.defer();
  var sets = [];
  var self = this;
  when(this.getSet(this.getPrimaryKey()))
    .then(function(set) {
      sets.push(set);
      when(self.getSet(self.getSecondaryKey()))
        .then(function(set) {
          sets.push(set);
          d.resolve(sets);
        }).otherwise(d.reject);
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.getPrimaryKey = function() {
  return this.name;
};

Delta.prototype.getSecondaryKey = function() {
  return this.name + '_2t';
};

exports.create = function(opts) {
  var d = when.defer();
  if (!opts.name) {
    throw new Error('Missing distribution name');
  }

  if (!opts.time) {
    throw new Error('Missing mean lifetime');
  }

  opts.date = opts.date || Date.now();

  var delta = new Delta(opts.name);
  when(delta.init(opts))
    .then(function() {
      d.resolve(delta);
    }).otherwise(d.reject);

  return d.promise;
};

exports.fetch = function(name) {
  var d = when.defer();
  var delta = new Delta(name);
  when(delta.exists(name))
    .then(function() {
      d.resolve(delta);
    }).otherwise(d.reject);
  return d.promise;
};