'use strict';

const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
const config = require(path.join(__dirname, '../../config/config'));
const helper = require(path.join(__dirname, '../common/helper'));
const Users = mongoose.model('Users');
const RefStatistics = mongoose.model('RefStatistics');
const AM = require('../routes/modules/account-manager');

const Batch = function () {
    this.batchTime = config.batch.refBatchInterval*60*1000 || 1*60*60*1000;
    this.pageSize = 200;
    this.init();
}

Batch.prototype.init = function () {
    this.batchId = setInterval(this.startCalculateReferal.bind(this), this.batchTime);
}

Batch.prototype.startCalculateReferal = function() {
    let query = {};
    Users.count(query, function(err, count) {
        let numberOfPage = parseInt((count / this.pageSize)) + 1;
        for(let i = 0; i < numberOfPage; i++) {
            Users.find(query, this.calculateForUsers.bind(this))
            .limit(this.pageSize)
            .skip(i * numberOfPage);
        }
    }.bind(this));
}

Batch.prototype.calculateForUsers = function(error, users) {
    if(!users || users.length == 0) return;


    let sod = new Date();
    let sodMinutes = sod.getMinutes();
    if (sodMinutes >0) sod.setMinutes(0);
    sod.setHours( sod.getHours() - 1 ); //1 hour back

    
    let eod = new Date();
    let eodMinutes = eod.getMinutes();
    if (eodMinutes >0) eod.setMinutes(0);
    
    
    users.forEach(user => {
        let { referral_code } = user;
        AM.getDailyStatisticReferredUser(referral_code, sod, eod, function (error, count){
            let refStatistic = {
                user_id: user._id,
                email_id: user._doc.email_id,
                date: sod,
                no_ref: count,
            };

            console.log("count value", count);

            if (count>0) {
                RefStatistics.create(refStatistic, (error, result) => {
                    let {date, no_ref} = result._doc;
                    console.log(`Created refs ${date} - No of ref ${no_ref}`);
                });
            }else {
                console.log(`0 Count at this hour ${sod} for ${user._doc.email_id}`);
            }

            /*let query = {"user_id": user._id, "date": {"$gte": sod, "$lt": eod}};
            RefStatistics.findOneAndUpdate(query, {no_ref: count}, (error, result) => {
                if(!result) {
                    RefStatistics.create(refStatistic, (error, result) => {
                        let {date, no_ref} = result._doc;
                        console.log(`Created refs ${date} - No of ref ${no_ref}`);
                    });
                } else {
                    let {date, no_ref} = result._doc;
                    console.log(`Updated refs ${date} - No of ref ${no_ref}`);
                }
            });*/
        });
    });
}

Batch.prototype.getHours

module.exports = new Batch();