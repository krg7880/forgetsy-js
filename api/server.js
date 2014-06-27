var restify = require('restify');
var Delta = require(__dirname + '/delta');
var time = require(__dirname + '/time');

function onCreate(req, res, next) {
	Delta.create({
    name: req.params.category
    ,time: req.params.time || time.week()
  }, function(e, delta) {
  	if (e) {
  		res.send('Error creating entry!');
  	} else {
  		res.send('Entry was created');
  	}

  	next();
  });
}

function onIncrement(req, res, next) {
	Delta.get(req.params.category, function(e, delta) {
		if (e) {
			return res.send('Error getting delta');
		}

    delta.incr({
      bin: req.params.bin
      ,by: req.params.by || 1
    }, function(e) {
      if (e) {
      	res.send('Error incrementing bin: ' + req.params.bin);
      } else {
      	res.send('Bin was successfully incremented: ' + req.params.bin);
      }

      next();
    });
  });
}

function onFetch(req, res, next) {
	Delta.get(req.params.category, function(e, delta) {
		var opts = {};
		if (req.params.bin) {
			opts.bin = req.params.bin
		}

		if (req.query.date) {
			opts.date = time[req.query.date]();
		}

		console.log(opts);

    delta.fetch(opts, function(e, trends) {
      if (e) {
      	res.send('Error fetching bin: ' + req.params.bin);
      } else {
      	res.send(JSON.stringify(trends));
      	next();
      }
    });
  });
}

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.gzipResponse());

server.get('/create/:category', onCreate);
server.get('/increment/:category/:bin/:by', onIncrement);
server.get('/fetch/:category/:bin', onFetch);
server.get('/fetch/:category', onFetch);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});