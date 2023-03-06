/*jslint node: true */
'use strict';

let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;

let systemLogsSchema = new Schema({
  type: {type: String, required: true},
  module: {type: String, required: true},
  created_by: {type: String, required: true},
  details: {type: String, required: true},
});

systemLogsSchema.set('timestamps', true); // include timestamps in docs

// apply the mongoose unique validator plugin to geoLocationSchema
systemLogsSchema.plugin(uniqueValidator);

// use mongoose currency to transform price
systemLogsSchema.set('toJSON', {
  virtuals: true,
  /*transform: function (doc, ret, options) {
    ret.price = Number(ret.price / 100).toFixed(2);
    delete ret.__v; // hide
    delete ret._id; // hide
  }*/
});

let SystemLogs = mongoose.model('SystemLogs', systemLogsSchema);

module.exports = SystemLogs;
