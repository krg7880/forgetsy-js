'use strict';

var when = require('when');
var connection = require('./connection');
var client = connection.get();

var Set = function(opts) {
  if (!opts instanceof Object) {
    throw new Error('Invalid argument error: !opts instanceof Object');
  }

  if (!opts.name) {
    throw new Error('Invalid argument error: opts.name is undefined');
  }

  this.lastDecayedKey = '_last_decay';
  this.lifetimeKey = '_t';
  this.hiPassFilter = 0.0001;
  this.name = opts.name;
};

Set.prototype.updateDecayDate = function(date) {
  var d = when.defer();
  client.zadd([this.name, date, this.lastDecayedKey], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve();
    }
  });

  return d.promise;
};

Set.prototype.createLifetimeKey = function(date) {
  var d = when.defer();
  client.zadd([this.name, date, this.lifetimeKey], function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve();
    }
  });
};

exports.create = function(opts) {
  var d = when.defer();
  if (!opts.time) {
    d.reject(new Error('Invalid argument error: opts.time is undefined'));
  } else {
    var date = opts.date || Date.now();
    var set = new Set(opts);

    when(set.updateDecayDate(date))
      .then(function() {
        when(set.createLifetimeKey(opts.time))
          .then(d.resolve)
          .otherwise(d.reject);
      }).otherwise(d.reject);
  }

  return d.promise;
};

exports.fetch = function(opts) {
  var d = when.defer();
  var limit = opts.limit || -1;
  
  return d.promise;
};