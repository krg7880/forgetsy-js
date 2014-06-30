var env = process.env;
var restify = require('restify');
var fs = require('fs');
var path = require('path');
var Delta = require(path.resolve(__dirname + '/lib/delta'));
var time = require(path.resolve(__dirname + '/lib/time'));
var cluster = require('cluster');
var cpus = require('os').cpus().length;
var workers = [];
var sigint = false;
var logger = console;

env.APP_PID = path.resolve(__dirname + '/master.pid');

function onCreate(req, res, next) {
  var time = req.query.time ? 
    (time[req.query.time] ? 
      time[req.query.time]() : time.week()) : time.week();
  Delta.create({
    name: req.params.category
    ,time: time
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


/**
 * Spawns on or more worker nodes
 * @param null
 * @return void
 */
var spawn = function() {
  for (var i=0; i<cpus; i++) {
    var worker = cluster.fork({worker_id: i});
    workers.push(worker);
    worker.on('listening', function(addr) {
      logger.info('Cluster worker is now listening ', addr.address, ':', addr.port);
    }).on('online', function() {
      logger.info('Cluster worker is ready to do work!');
    });
  }
};

/**
 * Removes a worker from the pool of workers
 * @param  {Object} Worker object to remove
 * @return void
 */
var removeWorker = function(worker) {
  var len = workers.length;
  for (var i=0; i<len; i++) {
    var current = workers[i];
    if (current && current.pid === worker.pid) {
      workers[i] = null;
      workers.splice(i, 1);
      break;
    }
  }
};

/**
 * Stops the worker processes
 * @param null
 * @return void
 */
var stopWorkers = function() {
  workers.forEach(function(worker){
    logger.info("Sending STOP message to worker PID: " + worker.pid);
    worker.send({cmd: "stop"});
  });
};

/**
 * Generates the pid file for the master process
 * @param null
 * @return void
 */
var writePID = function() {
  fs.writeFileSync(env.APP_PID,  process.pid.toString(), 'ascii');
};

if (cluster.isMaster && env.DEBUG !== "1") {
  writePID();
  spawn();
  cluster.on('exit', function(worker, code, sig) {
    logger.error('Cluster worker existed. Forking a new one...');
    cluster.fork();
  }).on('death', function(worker) {
    logger.error('Cluster work died... Creating a new one...');
    if (sigint) {
      logger.warn("SIGINT received! No workers will be spawned...");
    } else {
      removeWorker(worker);
      var newWorker = cluster.fork();
      workers.push(newWorker);
    }
  });

  process.on('SIGUSR2',function(){
      logger.warn("Received SIGUSR2 from system");
      logger.warn("There are " + workers.length + " workers running");
      stopWorkers();
  });

  process.on('SIGINT',function(){
      logger.warn('SIGINT issued! Terminating server...');
      sigint = true;
      process.exit();
  });
} else {
  server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
}

process.on('uncaughtException', function(err) {
  logger.error({err: err}, 'uncaught exception');
});