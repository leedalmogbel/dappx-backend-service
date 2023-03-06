/*jslint node: true */
'use strict';
var bunyan = require('bunyan');
var path = require('path');
var config = require(path.join(__dirname, '/config/config'));
var log = bunyan.createLogger({
    name: config.log.name,
    streams: [{
        level: 'debug',
        stream: process.stdout // log INFO and above to stdout
    }, {
        level: 'info',
        path: path.join(__dirname, '/logs/server.log'), // log ERROR and above to a file
        period: '1d',
    }, {
        level: 'error',
        path: path.join(__dirname, '/logs/server.log'), // log ERROR and above to a file
        period: '2d',
    }, ],
});
module.exports = log;