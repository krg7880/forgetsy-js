'use strict';

var set = require('./set');
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
  when(set.create({
    name: this.getPrimarySetKey()
    ,time: opts.time
    ,date: opts.date
  })).then(function() {
    when(set.create({
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

Delta.prototype.incr = function(opts) {
  var self = this;
  when(set.fetch(this.getPrimarySetKey()))
    .then(function(set) {
      when(set.incr(opts))
        .then(function() {
          when(set.fetch(this.getSecondarySetKey))
            .then(d.resolve)
            .otherwise(d.reject);
        });
    }).otherwise(d.reject);
};

Delta.prototype.exists = function() {
  var d = when.defer();
  client.exists([this.name], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve();
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

exports.incr = function(opts) {
  var d = when.defer();

  return d.promise;
};