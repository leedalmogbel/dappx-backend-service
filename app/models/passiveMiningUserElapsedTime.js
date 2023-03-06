/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let passiveMiningUserElapsedTime = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    mining_rate: {
        type: Number, 
        required: true,
    },
    elapsed_time: {
        type: Number,
        required: true,
    },
    elapsed_pando_earned: {
        type: Number,
        default: 0
    },
    elapsed_datetime: {
        type: Date
    },
    elapsed_datetime_end: {
        type: Date
    },
    usersplans_id : {
        type: String,
    }
});

passiveMiningUserElapsedTime.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
passiveMiningUserElapsedTime.plugin(uniqueValidator);
// use mongoose currency to transform price
passiveMiningUserElapsedTime.set('toJSON', {
    virtuals: true,
    /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});

let PassiveMiningUserElapsedTimes = mongoose.model('PassiveMiningUserElapsedTimes', passiveMiningUserElapsedTime);
module.exports = PassiveMiningUserElapsedTimes;