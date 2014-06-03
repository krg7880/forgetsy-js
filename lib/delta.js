var Promise = require('bluebird');
var Set = require('./set');
var time = require('./time');\
var connection = require('./connection');
var client = connection.get();
var NORM_T_MULT = 2;

var Delta = function(name) {
  this.name = name;
};

Delta.prototype.init = function(opts) {
  if (!opts.time) {
    throw new Error('Missing time');
  }

  var self = this;
  var secondaryDate = Date.now() - ((Date.now() - opts.date) * NORM_T_MULT);

  return Set.create({
    key: this.getPrimaryKey()
    ,time: opts.time
    ,date: opts.date
  }).then(function() {
    return Set.create({
      key: self.getSecondaryKey()
      ,time: opts.time
      ,date: secondaryDate
    });
  });
};

Delta.prototype.doFetch = function(opts) {
  var self = this;
  return this.getSets()
    .then(function(sets) {
      return sets[0].fetch(opts)
        .then(function(count) {
          return sets[1].fetch(opts)
            .then(function(norm) {
              return new Promise(function(resolve, reject) {
                resolve({count: count, norm: norm});
              });
            });
        });
    });
};

Delta.prototype.fetch = function(opts) {
  opts = opts || {};
  opts.decay = (typeof opts.decay == 'undefined') ? true : false;
  opts.scrub = (typeof opts.scrub == 'undefined') ? true : false;

  var limit = opts.limit || -1;
  delete opts.limit;

  var bin = opts.bin || null;
  var self = this;

  var fetchOpts = {
    primary: this.getPrimaryKey()
    ,secondary: this.getSecondaryKey()
    ,bin: bin
    ,scrub: opts.scrub
    ,decay: opts.decay
  };

  if (!bin) {
    return this.doFetch(fetchOpts)
      .then(function(res) {
        var norm = res.norm;
        var count = res.count;
        var value = 0;
        var results = [];
        for (var i in count) {
          var norm_v = norm[i];
          var value = (typeof norm_v === 'undefined') ? 0 : parseFloat(count[i]) / parseFloat(norm_v).toFixed(2);
          results[i] = parseFloat(value).toFixed(10);
        }

        return new Promise(function(resolve, reject) {
          resolve(results);
        })
      });
  } else {
    return this.doFetch(fetchOpts)
      .then(function(res) {
        var norm = res.norm;
        var count = res.count;
        var results = {};
        if (!norm) {
          results[bin] = null;
        } else {
          var norm_v = parseFloat(count) / parseFloat(norm).toFixed(2);
          results[bin] = norm_v;
        }
        
        return new Promise(function(resolve, reject) {
          resolve(results);
        })
      })
  }
};

Delta.prototype.incr = function(opts) {
  return this.getSets()
    .then(function(sets) {
      var errors = [];
      var count = 0;
      opts.by = opts.by || null;
      var promises = [];
      sets.forEach(function(set) {
        promises.push(set.incr({}));
      });

      return Promise.all(promises);
    });
};

Delta.prototype.exists = function(name) {
  return client.existsAsync(name);
};

Delta.prototype.getSet = function(key) {
  return Set.fetch(key);
};

Delta.prototype.getSets = function() {
  var self = this;
  var sets = [];
  return this.getSet(this.getPrimaryKey())
    .then(function(primarySet) {
      sets.push(primarySet);
      return self.getSet(self.getSecondaryKey())
        .then(function(secondarySet) {
          sets.push(secondarySet);
          return new Promise(function(resolve, reject) {
            resolve(sets);
          });
        });
    });
};

Delta.prototype.getPrimaryKey = function() {
  return this.name;
};

Delta.prototype.getSecondaryKey = function() {
  return this.name + '_2t';
};

exports.create = function(opts) {
  if (!opts.name) {
    throw new Error('Missing distribution name');
  }

  if (!opts.time) {
    throw new Error('Missing mean lifetime');
  }

  opts.date = opts.date || Date.now();

  var delta = new Delta(opts.name);
  return delta.init(opts);
};

exports.fetch = function(name) {
  var d = when.defer();
  var delta = new Delta(name);
  return delta.exists(name).then(function() {
    return new Promise(function(resolve, reject) {
      resolve(delta);
    });
  })
  
};