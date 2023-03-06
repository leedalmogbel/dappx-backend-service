/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let referalSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    email_id: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true
    },
    no_ref: {
        type: Number,
        required: true
    },
});
referalSchema.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
referalSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
referalSchema.set('toJSON', {
    virtuals: true,
    /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});
let RefStatistics = mongoose.model('RefStatistics', referalSchema);
module.exports = RefStatistics;