/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let usersPasswordSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    user_password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
});
usersPasswordSchema.set('timestamps', true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
usersPasswordSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
usersPasswordSchema.set('toJSON', {
    virtuals: true,
    /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});
let UsersPassword = mongoose.model('UsersPassword', usersPasswordSchema);
module.exports = UsersPassword;