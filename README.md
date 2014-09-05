<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [forgetsy-js](#forgetsy-js)
- [Status](#status)
- [NPM Stats](#npm-stats)
- [NOTICE](#notice)
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
    - [Initializing](#initializing)
    - [Create a distribution](#create-a-distribution)
    - [Increment a bin](#increment-a-bin)
    - [Fetch distribution (all)](#fetch-distribution-all)
    - [Fetch distribution (one)](#fetch-distribution-one)
    - [Fetch distribution (n)](#fetch-distribution-n)
  - [Example output](#example-output)
  - [Complete Example](#complete-example)
- [Basic Demo](#basic-demo)
    - [Create a distribution](#create-a-distribution-1)
    - [Increment a bin](#increment-a-bin-1)
    - [Fetch distribution](#fetch-distribution)
    - [Fetch all distributions](#fetch-all-distributions)
    - [Fetch all distributions with geo-location trends](#fetch-all-distributions-with-geo-location-trends)
  - [Testing](#testing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## forgetsy-js
NodeJS Trending library

## Status

[![Build Status](https://travis-ci.org/kirk7880/forgetsy-js.svg?branch=master)](https://travis-ci.org/kirk7880/forgetsy-js) [![Coverage Status](https://coveralls.io/repos/kirk7880/forgetsy-js/badge.png?branch=master)](https://coveralls.io/r/kirk7880/forgetsy-js?branch=master)

## NPM Stats
[![NPM](https://nodei.co/npm/forgetsy-js.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/json-promise/)

## NOTICE
This library was converted to use Promise/A+. Please see usage instructions below. 

## Description
Node.JS fork [Forgetsy](https://github.com/cavvia/forgetsy), a trending library designed to track temporal trends in non-stationary categorical distributions. Please fork or file an bug if you discover an issue. The project use [Redis](https://github.com/antirez/redis) as the backend. 

Please fork and make it better.

Installation
------------
npm install [forgetsy-js](https://www.npmjs.org/package/forgetsy-js)

## Usage

#### Initializing
```javascript
// setup redis
var redis = require('redis');
var client = redis.createClient();

// setup forgetsy-js & pass redis client
var delta = require('forgetsy-js');
delta.setRedisClient(client);
```

#### Create a distribution
```javascript
// name of distribution
var name = 'facebook-shares';

// name of bin
var bin = 'my-content-id';

var promise = delta.create({
  name: name
  , time: time
});

promise.then(function(dist) {
  // the distribution was create..
});

promise.catch(function(e) {
  // there was an error creating distribution
});
```

#### Increment a bin
```javascript
var promise = delta.get(name);

promise.then(function(dist) {
  var promise = dist.incr({
    bin: bin
    ,by: 1
  });

  promise.then(function() {
    // bin was incremented
  });

  promise.catch(function(e) {
    // bin was not incremented
  })
});
```

#### Fetch distribution (all)
```javascript
var promise = delta.get(name);

promise.then(function(dist) {
  var promise = dist.fetch();

  promise.then(function(trends) {
    console.log(trends);
  })

  promise.catch(function(e) {
    // error fetching distribution
  })
})
```

#### Fetch distribution (one)
```javascript
var promise = delta.get(name);

promise.then(function(dist) {
  // specify the bin to fetch
  var promise = dist.fetch({bin: bin});

  promise.then(function(trends) {
    console.log(trends);
  })

  promise.catch(function(e) {
    // error fetching distribution
  })
})
```

#### Fetch distribution (n)
```javascript
var promise = delta.get(name);

promise.then(function(dist) {
  // specify the bin to fetch
  var promise = dist.fetch({limit: 10});

  promise.then(function(trends) {
    console.log(trends);
  })

  promise.catch(function(e) {
    // error fetching distribution
  })
})
```

### Example output
```javascript
[
 {'item': 'one': 'score': 0.999999999997154}
,{'item': 'two': 'score': 0.9999999999939523}
]
```

### Complete Example
```javascript
var name = 'facebook-shares';
var bin = 'my-content-id2';

delta.create({
  name: name,
  time: getDays(14)
})
.then(function(dist) {
  // delta created
  // in
  dist.incr({
    bin: bin,
    by: 1
  })
  .then(function() {

    dist.fetch()
    .then(function(trends) {
      console.log(trends);
    })
    .catch(function(e) {
      // error fetching distribution
    });
  })
  .catch(function(e) {
    // bin was not incremented
  });
})
.catch(function(e) {
  // there was an error creating distribution
});
```

## Basic Demo
This is a very basic working API demo.

#### Create a distribution
Categories are the distributions to create
* classical
* modern
* street

Type is the type of distributions we're creating. In this case, the categories 
are related to "art." You can classify the distributions as you see fit. For 
example, "type" could easily refer to "music." (Probably sans "street" [:-])

[http://104.131.230.35/create?categories=classical,moden,street&type=art](http://104.131.230.35/create?categories=classical,moden,street&type=art)

#### Increment a bin
Here we will trend a bin, "banksy & Barbara Kruger" the famous street artist. 

[http://104.131.230.35/incr?categories=street&type=art&bin=banksy](http://104.131.230.35/incr?categories=street&type=art&bin=banksy)

[http://104.131.230.35/incr?categories=street&type=art&bin=Barbara Kruger](http://104.131.230.35/incr?categories=street&type=art&bin=Barbara Kruger)

#### Fetch distribution
Here we will fetch what's trending in category "street" of type "art"

[http://104.131.230.35/fetch?categories=street&type=art&filters=geoip](http://104.131.230.35/fetch?categories=street&type=art&filters=geoip)

#### Fetch all distributions
Here we will fetch what's trending in all of the categories of type "art"

[http://104.131.230.35/fetch?categories=classical,moden,street&type=art&filters=geoip](http://104.131.230.35/fetch?categories=classical,moden,street&type=art&filters=geoip)

#### Fetch all distributions with geo-location trends
Here we will fetch what's trending in all of the categories of type "art" and
geo-location trends. Behind the scenes, the API is detecting your location and
trending based on geo-location as well (assuming your location was detected!)

[http://104.131.230.35/fetch?categories=classical,moden,street&type=art](http://104.131.230.35/fetch?categories=classical,moden,street&type=art)

### Testing
npm test