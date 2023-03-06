/* jslint node: true */
"use strict";
require('dotenv').config();
let path = require("path");
let rootPath = path.normalize(__dirname + "/..");
let NODE_ENV = process.env.NODE_ENV || "development";
let NODE_HOST = process.env.NODE_HOST || "localhost";
let NODE_PORT = process.env.NODE_PORT || 4000;
let MONGO_HOST = process.env.MONGO_HOST || "localhost";
let MONGO_PORT = process.env.MONGO_PORT || 27017;
let MONGO_USER = process.env.MONGO_USER || "dappx";
let MONGO_PASS = process.env.MONGO_PASS || "dappx123";
let LOG_LEVEL = process.env.LOG_LEVEL || "info";

const MINING_RATE = process.env.MINING_RATE || 1; // pando per minute earn from mining
const REFERAL_RATE = process.env.REFERAL_RATE || 10; // percentage
const REFERAL_BATCH_INTERVAL = process.env.REFERAL_BATCH_INTERVAL || 60; // minutes

let APP_NAME = "dappxEngine";

let config = {
    development: {
        env: NODE_ENV,
        root: rootPath,
        adminPanelApiUrl: "https://admin-panel-api-sat.pandobrowser.com",
        cryptoApiUrl: "http://149.56.44.95:3003",
        adminPanelUrl: "https://admin-panel-dev.pandobrowser.com",
        app: {
            name: APP_NAME + NODE_ENV,
            address: NODE_HOST,
            port: NODE_PORT,
        },
        db: {
            host: MONGO_HOST,
            port: MONGO_PORT,
            user: MONGO_USER,
            pass: MONGO_PASS,
            name: APP_NAME + NODE_ENV,
        },
        log: {
            name: APP_NAME + NODE_ENV,
            level: LOG_LEVEL,
        },
        email: {
            host: "smtp.mandrillapp.com",
            port: 587,
            secure: false,
            auth: {
                user: "Dappatoz",
                pass: "Ej9AeUTONCSos04VXqqIJQ",
            },
        },
        mining: {
            rate: MINING_RATE,
            referalRate: REFERAL_RATE,
        },
        batch: {
            refBatchInterval: REFERAL_BATCH_INTERVAL
        },
        externalURLs : {

            packageURL: "https://dappx-adminapi-sat.dappstore.me/package/"
        },
        uniqueName1 : ['Decent','Sad','Happy','Plain','Bald','Homely','Scruffy','Blonde','Shapely','Chubby','Short','Lanky','Skinny','Fat','Slender','Fit','Flabby','Stocky','Strong','Tall','Tart','Tattoed','Large','Thin','Weak'],
        uniqueName2 : ["Chatty","Brave","Clever","Purple","Funny","Grumpy","Honest","Kind","Loud","Lucky","Moody","Neat","Nice","Polite","Crass","Quiet","Rude","Selfish","Wordy","Shy","Smart","Tidy","Vain","Fast"],
        uniqueName3 : ["Baby","Being","Bird","Body","Devil","Duck","Egg","Face","Dude","Head","Human","Life","Man","Mortal","Party","Scout","Slob","Soul","Stiff","Thing","Monster","Person","Child","Player"],
        uniqueName4 : [1,99]
        
    },
    sat: {
        env: NODE_ENV,
        root: rootPath,
        adminPanelApiUrl: "https://admin-panel-api-sat.pandobrowser.com",
        cryptoApiUrl: "http://149.56.44.95:3003",
        adminPanelUrl: "https://admin-panel-dev.pandobrowser.com",
        app: {
            name: APP_NAME + NODE_ENV,
            address: NODE_HOST,
            port: NODE_PORT,
        },
        db: {
            host: MONGO_HOST,
            port: MONGO_PORT,
            user: MONGO_USER,
            pass: MONGO_PASS,
            name: APP_NAME + NODE_ENV,
        },
        log: {
            name: APP_NAME + NODE_ENV,
            level: LOG_LEVEL,
        },
        email: {
            host: "smtp.mandrillapp.com",
            port: 587,
            secure: false,
            auth: {
                user: "Dappatoz",
                pass: "Ej9AeUTONCSos04VXqqIJQ",
            },
        },
        mining: {
            rate: MINING_RATE,
            referalRate: REFERAL_RATE,
        },
        batch: {
            refBatchInterval: REFERAL_BATCH_INTERVAL
        },
        externalURLs : {

            packageURL: "https://dappx-adminapi-sat.dappstore.me/package/"
        },
        uniqueName1 : ['Decent','Sad','Happy','Plain','Bald','Homely','Scruffy','Blonde','Shapely','Chubby','Short','Lanky','Skinny','Fat','Slender','Fit','Flabby','Stocky','Strong','Tall','Tart','Tattoed','Large','Thin','Weak'],
        uniqueName2 : ["Chatty","Brave","Clever","Purple","Funny","Grumpy","Honest","Kind","Loud","Lucky","Moody","Neat","Nice","Polite","Crass","Quiet","Rude","Selfish","Wordy","Shy","Smart","Tidy","Vain","Fast"],
        uniqueName3 : ["Baby","Being","Bird","Body","Devil","Duck","Egg","Face","Dude","Head","Human","Life","Man","Mortal","Party","Scout","Slob","Soul","Stiff","Thing","Monster","Person","Child","Player"],
        uniqueName4 : [1,99]
    },
    uat: {
        env: NODE_ENV,
        root: rootPath,
        adminPanelApiUrl: "https://admin-panel-api-sat.pandobrowser.com",
        cryptoApiUrl: "http://149.56.44.95:3003",
        adminPanelUrl: "https://admin-panel-dev.pandobrowser.com",
        app: {
            name: APP_NAME + NODE_ENV,
            address: NODE_HOST,
            port: NODE_PORT,
        },
        db: {
            host: MONGO_HOST,
            port: MONGO_PORT,
            user: MONGO_USER,
            pass: MONGO_PASS,
            name: APP_NAME + NODE_ENV,
        },
        log: {
            name: APP_NAME + NODE_ENV,
            level: LOG_LEVEL,
        },
        email: {
            host: "smtp.mandrillapp.com",
            port: 587,
            secure: false,
            auth: {
                user: "Dappatoz",
                pass: "Ej9AeUTONCSos04VXqqIJQ",
            },
        },
        mining: {
            rate: MINING_RATE,
            referalRate: REFERAL_RATE,
        },
        batch: {
            refBatchInterval: REFERAL_BATCH_INTERVAL
        },
        externalURLs : {

            packageURL: "https://dappx-adminapi-sat.dappstore.me/package/"
        },
        uniqueName1 : ['Decent','Sad','Happy','Plain','Bald','Homely','Scruffy','Blonde','Shapely','Chubby','Short','Lanky','Skinny','Fat','Slender','Fit','Flabby','Stocky','Strong','Tall','Tart','Tattoed','Large','Thin','Weak'],
        uniqueName2 : ["Chatty","Brave","Clever","Purple","Funny","Grumpy","Honest","Kind","Loud","Lucky","Moody","Neat","Nice","Polite","Crass","Quiet","Rude","Selfish","Wordy","Shy","Smart","Tidy","Vain","Fast"],
        uniqueName3 : ["Baby","Being","Bird","Body","Devil","Duck","Egg","Face","Dude","Head","Human","Life","Man","Mortal","Party","Scout","Slob","Soul","Stiff","Thing","Monster","Person","Child","Player"],
        uniqueName4 : [1,99]
    },
    production: {
        env: NODE_ENV,
        root: rootPath,
        adminPanelApiUrl: "https://admin-panel-api.pandobrowser.com",
        cryptoApiUrl: "http://localhost:3003",
        adminPanelUrl: "https://admin-panel.pandobrowser.com",
        app: {
            name: APP_NAME + NODE_ENV,
            address: NODE_HOST,
            port: NODE_PORT,
        },
        db: {
            host: MONGO_HOST,
            port: MONGO_PORT,
            user: MONGO_USER,
            pass: MONGO_PASS,
            name: APP_NAME + NODE_ENV,
        },
        log: {
            name: APP_NAME + NODE_ENV,
            level: LOG_LEVEL,
        },
        email: {
            host: "smtp.mandrillapp.com",
            port: 587,
            secure: false,
            auth: {
                user: "Dappatoz",
                pass: "Ej9AeUTONCSos04VXqqIJQ",
            },
        },
        mining: {
            rate: MINING_RATE,
            referalRate: REFERAL_RATE,
        },
        batch: {
            refBatchInterval: REFERAL_BATCH_INTERVAL
        },
        externalURLs : {

            packageURL: "https://dappx-adminapi-sat.dappstore.me/package/"
        },
        uniqueName1 : ['Decent','Sad','Happy','Plain','Bald','Homely','Scruffy','Blonde','Shapely','Chubby','Short','Lanky','Skinny','Fat','Slender','Fit','Flabby','Stocky','Strong','Tall','Tart','Tattoed','Large','Thin','Weak'],
        uniqueName2 : ["Chatty","Brave","Clever","Purple","Funny","Grumpy","Honest","Kind","Loud","Lucky","Moody","Neat","Nice","Polite","Crass","Quiet","Rude","Selfish","Wordy","Shy","Smart","Tidy","Vain","Fast"],
        uniqueName3 : ["Baby","Being","Bird","Body","Devil","Duck","Egg","Face","Dude","Head","Human","Life","Man","Mortal","Party","Scout","Slob","Soul","Stiff","Thing","Monster","Person","Child","Player"],
        uniqueName4 : [1,99]
    },
};
module.exports = config[NODE_ENV];