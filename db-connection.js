/*jslint node: true */
'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var path = require('path');

var config = require(path.join(__dirname, '/config/config'));
var log = require(path.join(__dirname, 'log'));

module.exports = function () {
  console.log('config value', config);
  var uri = ''.concat('mongodb://',config.db.user,':',config.db.pass,'@',config.db.host, ':', config.db.port, '/', config.db.name);
  var options = { useMongoClient: true, promiseLibrary: require('bluebird') };
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  // mongoose.connect('mongodb://localhost/pandoEnginedevelopment');

  // var db = mongoose.createConnection(uri, options);
  // var db = mongoose.createConnection('mongodb://localhost/pandoEnginedevelopment', options);

  var db = mongoose.connection;

  db.on('connected', function () {
    log.info('Mongodb connection open to ' + uri);
  });
  db.on('error', function () {
    throw new Error('unable to connect to database at ' + db_url);
  });
  db.on('disconnected', function () {
    log.info('Mongodb connection disconnected');
  });
  process.on('SIGINT', function () {
    db.close(function () {
      log.info('Mongodb connection disconnected through app termination');
      process.exit(0);
    });
  });
};