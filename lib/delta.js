var path = require('path');
var Promise = require('bluebird');
var join = Promise.join;
var client = null;
var Set = require(path.resolve(__dirname + '/set'));
var NORM_T_MULT = 2;
var NOOP = function() {};

var Delta = function(name) {
  if (!this instanceof Delta) {
    return new Delta(name);
  }

  this.name = name;
};

/**
Creates the primary and secondary distribution sets.

@param {Object} o Config object:
  o.time - Primary distribution time
  o.date - Primary distribtuion decay date
  o.secondaryTime - Secondary distribtuion time (double the primary time)
  o.secondaryDate - Secondary distribution decay date (half of primary date)
@param {Function} cb Function to invoke after
execution completes.
*/
Delta.prototype.init = function(options) {
  return new Promise(function onInit(resolve, reject) {
    var o = options;
    var now = new Date().getTime();
    var secondaryDate = o.secondaryDate || (now - ((now - o.date) * NORM_T_MULT));
    var primaryPromise = Set.create({
      key: this.getPrimaryKey()
      ,time: o.time
    });

    var secondaryPromise = Set.create({
      key: this.getSecondaryKey()
      ,time: o.secondaryTime || (o.time * NORM_T_MULT)
      ,date: o.date
    });

    return join(primaryPromise, secondaryPromise, function(primary, secondary) {
      return {primary: primary, secondary: secondary};
    })
      .bind()
      .then(resolve)
      .catch(reject)
  }.bind(this));
};

Delta.prototype.execFetch = function(o) {
  return new Promise(function doFetch(resolve, reject) {
    var primarySet = this.getSet(o.primary);
    if (!primarySet) return reject(new Error('Unable to initialize primary Set!'));

    var secondarySet = this.getSet(o.secondary);
    if (!secondarySet) return reject(new Error('Unable to initialize secondary Set!'));

    return join(primarySet.fetch(o), secondarySet.fetch(o), function(count, norm) {
      return {count: count, norm: norm};
    })
      .bind()
      .then(resolve)
      .catch(reject);

  }.bind(this));
};

Delta.prototype.processResults = function(options) {
  return new Promise(function(resolve, reject) {
    var _sets = options.sets;
    var o = options.o;
    var results = [];
    var primary = _sets.norm; // primary
    var secondary = _sets.count; // secondary

    if (!o.bin) {
      var norm_v = null;
      var count_v = null;
      for (var i in primary) {
        norm_v = parseFloat(primary[i]);
        count_v = parseFloat(secondary[i]);
        results.push({'item': i, 'score' : ((typeof norm_v === 'undefined') ? 0 : count_v / norm_v)});
      }

      return resolve(results);
    } 

    if (!primary) {
      results[o.bin] = null;
    } else {
      var score = secondary / primary;
      results.push({'item': o.bin, 'score' : score});
    }

    resolve(results);
  });
};

Delta.prototype.fetch = function(options) {
  return new Promise(function(resolve, reject) {
    var o = options || {};
    o.decay = (typeof o.decay === 'undefined') ? true : ((o.decay) ? true : false);
    o.scrub = (typeof o.scrub === 'undefined') ? true : ((o.scrub) ? true : false);

    o.limit = o.limit || -1;

    var count = 0;
    var norm = 0;
    var result = 0;
    var fetchOptions = {
      primary: this.getPrimaryKey()
      ,secondary: this.getSecondaryKey()
      ,bin: o.bin
      ,scrub: o.scrub
      ,decay: o.decay
      ,limit: o.limit
    };

    this.execFetch(fetchOptions)
      .bind(this)
      .then(function(sets) {
        this.processResults({sets: sets, o: o})
          .bind(this)
          .then(resolve)
          .catch(reject);
      })
      .catch(reject)
  }.bind(this));
};

Delta.prototype.getPrimaryKey = function() {
  return this.name;
};

Delta.prototype.getSecondaryKey = function() {
  return this.name + '_2t';
};

Delta.prototype.incr = function(o) {
  return new Promise(function onIncrPromise(resolve, reject) {
    var set = this.getSets();
    var count = -1;
    var len = sets.length;
    var errors = [];

    var run = function() {
      if (++count < len) {
        return sets[count].incr(o)
          .then(function onIncrSuccess() {
            run();
          })
          .catch(function onIncrError(e) {
            errors.push(e);
            run();
          });
      } 

      if (e.length > 0) {
        return reject(new Error('One or more errors incrementing bin'));
      }

      resolve();
    }

    run();
  }.bind(this));
};

Delta.prototype.exists = function(cb) {
  return client.existsAsync(this.name);
};

Delta.prototype.getSet = function(key) {
  return Set.get(key);
};

Delta.prototype.getSets = function() {
  return [this.getSet(this.getPrimaryKey()), this.getSet(this.getSecondaryKey())];
};

exports.create = function(options) {
  return new Promise(function onCreate(resolve, reject) {
    var o = options;
    if (typeof o !== typeof {}) return reject(new Error('Invalid options!'));

    if (!o.name) return reject(new Error('Missing distribution name'));

    if (!o.time) return reject(new Error('Missing mean lifetime'));

    o.date = o.date || new Date().getTime();
    var delta = new Delta(o.name);

    delta.init(o)
      .then(function onInit() {
        resolve(delta);
      })
      .catch(reject);
  });
};

/**
Accepts a reference to the redis client.

@param {Object} client
@return void
*/
exports.setRedisClient = function(_client) {
  client = Promise.promisifyAll(_client);
  Set.setRedisClient(client);
};

exports.get = function(name) {
  return new Promise(function onPromise(resolve, reject) {
    var delta = new Delta(name);
    delta.exists()
      .then(function onExistsComplete() {
        resolve(delta);
      })
      .catch(function onExistsError(e) {
        reject(e);
      });
  });
};