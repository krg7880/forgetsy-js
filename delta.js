'use strict';

var Set = require('./set');
var time = require('./time');
var connection = require('./connection');
var client = connection.get();
var when = require('when');
var TIME_NORM_MULTIPLIER = 2;

var Delta = function(opts) {
  this.name = opts.name;
};

Delta.prototype.create = function(opts) {
  var d = when.defer();
  var secondaryDate = this.getSecondaryDate(opts.date);
  var self = this;
  when(Set.create({
    name: this.getPrimarySetKey()
    ,time: opts.time
    ,date: opts.date
  })).then(function() {
    when(Set.create({
      name: self.getSecondarySetKey()
      ,time: (opts.time * TIME_NORM_MULTIPLIER)
      ,date: secondaryDate
    })).then(d.resolve).otherwise(d.reject);
  }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.getPrimarySetKey = function() {
  return this.name;
};

Delta.prototype.getSecondarySetKey = function() {
  return [this.name, "_2t"].join('');
};

Delta.prototype.getSecondaryDate = function(opts) {
  return Date.now() - ((Date.now() - opts.date) * TIME_NORM_MULTIPLIER);
};

/**
 Fetch the primary and secondary
 set and increment them both
*/
Delta.prototype.incr = function(opts) {
  var d = when.defer();
  var self = this;
  var deltas = this.deltas();
  var completed = 0;

  var check = function() {
    if (++completed >= deltas.length) {
      if (errors) {
        d.reject(error);
      } else {
        d.resolve();
      }
    }
  };

  deltas.forEach(function(delta) {
    when(Set.fetch(delta))
     .then(function(set) {
        console.log('Set', set);
        when(set.incr(opts))
          .then(function() {
            check();
          }).otherwise(function() {
            check();
          })
      }).otherwise(function() {
        check();
      })
  });

  return d.promise;
};

Delta.prototype.deltas = function() {
  return [this.getPrimarySetKey(), this.getSecondarySetKey()];
};

Delta.prototype.exists = function() {
  var d = when.defer();
  client.exists([this.name], function(e, res) {
    console.log(res);
    if (e) {
      d.reject(e);
    } else if (parseInt(res, 10) === 1) {
      d.resolve();
    } else {
      d.reject(new Error('Delta does not exists!'));
    }
  });
  return d.promise;
}

exports.create = function(opts) {
  var d = when.defer();
  if (typeof opts !== 'object') {
    d.reject(new Error('Invalid argument error - !type object'));
  } else if (!opts.name) {
    d.reject(new Error('Invalid argument error - !property  object.name'))
  } else if (!opts.time) {
    d.reject(new Error('Invalid argument error - !property object.time'))
  } else {
    var delta = new Delta(opts);
    opts.date = opts.date || Date.now(); 
    when(delta.create(opts))
      .then(function() {
        d.resolve(delta);
      }).otherwise(d.reject);
  }

  return d.promise;
};

exports.fetch = function(opts) {
  var d = when.defer();
  var delta = new Delta(opts);
  when(delta.exists())
    .then(function() {
      d.resolve(delta)
    }).otherwise(d.reject);

  return d.promise;
}