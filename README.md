# forgetsy-js

## Status

[![Build Status](https://travis-ci.org/kirk7880/forgetsy-js.svg?branch=feature/promise)](https://travis-ci.org/kirk7880/forgetsy-js) [![Coverage Status](https://coveralls.io/repos/kirk7880/forgetsy-js/badge.png?branch=feature/promise)](https://coveralls.io/r/kirk7880/forgetsy-js?branch=feature/promise)

## NPM Stats
[![NPM](https://nodei.co/npm/forgetsy-js.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/json-promise/)

## Description
Nodejs fork of [Forgetsy](https://github.com/cavvia/forgetsy) temporal trending library. This is still work in progress and needs proper testing and still undergoing heavy development. If you discover an issue, please open a ticket to have it resolved or fork and fix :-) The project use [Redis](https://github.com/antirez/redis) as the backend. 

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

promise.then(function(delta) {
  // the distribution was create..
});

promise.catch(function(e) {
  // there was an error creating distribution
});
```

#### Increment a bin
```javascript
var promise = delta.get(name);

promise.then(function(delta) {
  var promise = delta.incr({
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

promise.then(function(delta) {
  var promise = delta.fetch();

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

promise.then(function(delta) {
  // specify the bin to fetch
  var promise = delta.fetch({bin: bin});

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

promise.then(function(delta) {
  // specify the bin to fetch
  var promise = delta.fetch({limit: 10});

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

### Testing
npm test