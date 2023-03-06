/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let usersOTPSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    user_otp: {
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        required: true
    },
    otp_expiry: {
        type: Number
    },
    last_resend: {
        type: Date
    }
});

usersOTPSchema.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
usersOTPSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
usersOTPSchema.set('toJSON', {
    virtuals: true,
});
let UsersOTP = mongoose.model('UsersOTP', usersOTPSchema);
module.exports = UsersOTP;