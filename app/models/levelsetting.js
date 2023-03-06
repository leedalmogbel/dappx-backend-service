/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let levelSchema = new Schema({
    level: {
        type: String, // name of level
        required: true,
    },
    index: {
        type: Number, // index of level
        required: true
    },
    rate: {
        type: Number, // rate percentage earning
        required: true
    },
});
levelSchema.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
levelSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
levelSchema.set('toJSON', {
    virtuals: true,
    /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});
let Levels = mongoose.model('Levels', levelSchema);
module.exports = Levels;