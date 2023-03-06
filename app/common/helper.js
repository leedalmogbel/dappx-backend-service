/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let path = require('path');
let config = require(path.join(__dirname, '../../config/config'));

let systemLogs = mongoose.model('SystemLogs');
module.exports = {
    log: (data, callback) => {

        console.log("data", data);
        let sysLog = new systemLogs({
            type: data.type,
            module: data.module,
            created_by: data.created_by,
            details: data.details,
        });
        sysLog.save(function(error, sysData, numAffected) {
            if (error) {
                callback(true, error)
            } else {
                callback(false)
                //return next();
            }
        });
    }
}