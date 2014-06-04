'use strict';

var day = (60 * 60 * 24 * 1000);
var week = (day * 7);
var month = (week * 4);
var year = (month * 12);

module.exports = {
  hour: function() {
    return (new Date().getTime() + (60 * 60));
  }
  ,day: function() {
    return (new Date().getTime() + day);
  }
  ,week: function() {
    return (new Date().getTime() + week);
  }
  ,month: function() {
    return (new Date().getTime() + month);
  }
  ,year: function() {
    return (new Date().getTime() + year);
  }
  ,daysAgo: function(num) {
    return (new Date().getTime() - (num * days));
  }
  ,weeksAgo: function(num) {
    return (new Date().getTime() - (num * week));
  }
  ,monthsAgo: function(num) {
    return (new Date().getTime() - (num * week));
  }
  ,yearsAgo: function(num) {
    return (new Date().getTime() - (num * year));
  }
};