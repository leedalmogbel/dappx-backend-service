'use strict'

const Utils = {};
const aesjs = require('aes-js');
const pbkdf2 = require('pbkdf2');
const validAddress = require('ethereum-address');
const crypto = require('crypto');

const payloadKey = "H+MbPeShVmYq3t6w9z$C&F)J@NcRfTjW";

Utils.isValidAddress = function(address) {
    return validAddress.isAddress(address);
}

Utils.isEmpty = function (str) {
    return !str || str.trim() == '';
}

const getKey = function(password, salt) {
    return pbkdf2.pbkdf2Sync(password, salt, 1, 256 / 8, 'sha512');
}

Utils.encryptString = function (password, salt, hexString) {
    var key = getKey(password, salt);
    var textBytes = aesjs.utils.utf8.toBytes(hexString);
    var aesCtr = new aesjs.ModeOfOperation.ctr(key);
    var encrypted = aesCtr.encrypt(textBytes);
    return {
        hex: aesjs.utils.hex.fromBytes(encrypted),
    };
}
 
Utils.decryptString = function (password,salt, hexString) {
    var key = getKey(password, salt);
    var encryptedBytes = aesjs.utils.hex.toBytes(hexString);
    var aesCtr = new aesjs.ModeOfOperation.ctr(key);
    var decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

Utils.decryptPayload = function (encryptedString, callback) {
    try {
        var key = [];
        var buffer = new Buffer(payloadKey, 'utf-8');
        for (var i = 0; i < buffer.length; i++) {
            key.push(buffer[i]);
        }
        const cc = crypto.createDecipher('aes-128-ecb', new Buffer(key));
        const decrypted = Buffer.concat([cc.update(encryptedString, 'base64'), cc.final()]).toString('utf8');
        callback(null, JSON.parse(decrypted));
    } catch (error) {
        callback({
            code: 400,
            message: 'Invalid payload'
        }, null);
    }
}

Utils.log = function () {
    const date = new Date().toISOString();
    const args = Array.from(arguments);
    const prefix = `${date} [${this.constructor.name}]`;
    args.unshift(prefix);
    console.log.apply(console, args);
}

module.exports = Utils;