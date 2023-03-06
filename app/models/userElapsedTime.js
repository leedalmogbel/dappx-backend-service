/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let usersElapsedSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    elapsed_time: {
        type: Number,
        required: true,
    },
    mining_rate: {
        type: Number, 
        required: true,
    },
    elapsed_pando_earned: {
        type: Number,
        default: 0
    },
    booster_rate: {
        type: Number,
        default: 0,
    },
    booster_elapsed_pando_earned: {
        type: Number,
        default: 0
    },
    ref_user_id: {
        type: String,
        index: true
    },
    ref_rate: {
        type: Number,
        default: 0
    },
    referral_pando_earned: {
        type: Number,
        default:0
    }
});
usersElapsedSchema.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
usersElapsedSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
usersElapsedSchema.set('toJSON', {
    virtuals: true,
    /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});
let UsersElapsedTime = mongoose.model('UsersElapsedTime', usersElapsedSchema);
module.exports = UsersElapsedTime;