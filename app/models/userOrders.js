/*jslint node: true */
"use strict";
let mongoose = require("mongoose");
let uniqueValidator = require("mongoose-unique-validator");
var uuid = require('uuid-random');
let Schema = mongoose.Schema;
let userOrdersSchema = new Schema({
  wallet_address: {
    type: String,
    required:true,
    index: true
  },
  user_id: {
    type: String,
  },
  project_id: {
    type: String,
    required:true
  },
  package_id: {
    type: String,
    required:true
  },
  tx_hash: {
    type: String
  },
  price: {
    type: String
  },
  counter: {
    type: Number,
    default:1
  },
  payer: {
    type: String
  },
  order_status: {
    type: String,
    default:'pending'
  },
  order_validity: {
    type: Boolean,
    default:true
  }
});
userOrdersSchema.set("timestamps", true); // include timestamps in docs
// apply the mongoose unique validator plugin to geoLocationSchema
userOrdersSchema.plugin(uniqueValidator);
// use mongoose currency to transform price
userOrdersSchema.set("toJSON", {
  virtuals: true
});
let UserOrders = mongoose.model("UserOrders", userOrdersSchema);
module.exports = UserOrders;
