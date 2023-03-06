/*jslint node: true */
"use strict";
let mongoose = require("mongoose");
let uniqueValidator = require("mongoose-unique-validator");
var uuid = require('uuid-random');
let Schema = mongoose.Schema;
let usersSchema = new Schema({
  public_address: {
    type: String,
    requied:true,
    index: true
  },
  nonce: {
    type: String,
    default: uuid()
  },
  email_id: {
    type: String,
    index: true,
  },
  username: {
    type: String,
  },
  referral_code: {
    type: String,
  },
  referral_by: {
    type: String
  },
  image: {
    type:String
  },
  balance: {
    type: Number
  },
  is_blocked: {
    type: Number
  }
});
usersSchema.set("timestamps", true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
usersSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
usersSchema.set("toJSON", {
  virtuals: true,
  /*transform: function (doc, ret, options) {
      ret.price = Number(ret.price / 100).toFixed(2);
      delete ret.__v; // hide
      delete ret._id; // hide
    }*/
});
let Users = mongoose.model("Users", usersSchema);
module.exports = Users;
