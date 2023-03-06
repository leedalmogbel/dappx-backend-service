const guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}

const makeReferalCode=() =>{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 16; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}

const fs = require('fs');
const crypto = require('crypto');
const customErrors = require('restify-errors');
let mongoose = require('mongoose');
let Users = mongoose.model('Users');
let UsersPassword = mongoose.model('UsersPassword');
let UsersElapsedTime = mongoose.model('UsersElapsedTime');
const PassiveMiningUserElapsedTimes = mongoose.model('PassiveMiningUserElapsedTimes');
const RefStatistics = mongoose.model('RefStatistics');
const UserPlans = mongoose.model('UsersPlans');
const Plans = mongoose.model('Plans');
const Withdrawal = mongoose.model('Withdrawal');
const BlackList = mongoose.model('BlackList');
let Settings = mongoose.model("Settings");
let UsersOTP = mongoose.model('UsersOTP');
let UserOrders = mongoose.model('UserOrders');
let Utils = require('../../common/Utils');
var nodemailer = require('nodemailer');
var uuid = require('uuid');
var request = require("request");
let config = require('./../../../config/config');
var ethSignUtil = require('eth-sig-util');
var ethJSUtil = require('ethereumjs-util');
var Request = require("request");
const Web3Utils = require('web3-utils');

const { withdrawalStatus } = require('../../common/constants');

var transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure:config.email.secure,
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.pass
  }
});

exports.generateLoginKey = function(callback) {
    let cookie = guid();
    callback(cookie);
}
exports.validateLoginKey = function(req, callback) {
    // ensure the cookie maps to the user's last recorded ip address //
    if (req.cookies.login == req.session.key) {
        callback(false);
    } else {
        callback(true);
    }
}
exports.generateSalt = function() {
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
}
exports.md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}
exports.saltAndHash = function(pass, callback) {
    var salt = exports.generateSalt();
    callback(salt, exports.md5(pass + salt));
}
exports.validatePassword = function(plainPass, hashedPass, salt, callback) {
    var validHash = exports.md5(plainPass + salt);
    callback(hashedPass === validHash);
}
exports.validateOTP = function(plainOTP, dbOTP, callback) {
    callback(plainOTP === dbOTP);
}

var getObjectId = function(id)
{
    return new require('mongodb').ObjectID(id);
}

exports.generateRefferalCode  = function(callback) {
    var referralCode = REFERRAL_CODE_GENERATOR.alpha('uppercase', 6);

    Users.findOne({
        referral_code: referralCode
    }, '_id', function(err, results) {
        if (results) {
            exports.generateRefferalCode(callback);
        }else {
            callback(referralCode);
        }
    })

}

exports.isBlackList = function(email, callback) {
    BlackList.findOne({ email_id: email }, (error, result) => {
        if(error) {
            var myErr = new customErrors.InternalError({
                statusCode: 500
            }, 'Error validating user email');
            callback(true, myErr);
        } else {
            if(result) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        }
    });
}

exports.getUserNonce = function(publicAddress, callback) {
    Users.findOne({
            public_address: publicAddress
        }, function(err, results) {
            //console.log("User record", results)
            if (results) {
                callback(false, results);
            } else {

                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Account doesn\'t\ exists');
                
                callback(true, myErr);
            }
        });
}

exports.createAccount = function(req, callback) {

    if(req.body.publicAddress) {
        if (req.body.email_id !== '') {
            Users.findOne({email_id: req.body.email_id.toLowerCase()}, '_id,', function(err, results) {
                if (results) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'Email already exist on our record. Please provide a new email.');
                    callback(true, myErr);
                }
            });
        }
        Users.findOne({public_address: req.body.publicAddress.toLowerCase()}
        , '_id', function(err, results) {
            // console.log("results", results)
            if (results) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Account already exists');
                callback(true, myErr);
            } else {
                var referralCode = exports.generateRefferalCode(function(refferalCode) {

                    exports.createRandomUserName(1, function(err, data) {

                        if (err) {
                            callback(true, data);
                        }else {

                            let _userModel = new Users({
                                public_address: req.body.publicAddress.toLowerCase(),
                                nonce: uuid.v4(),
                                email_id: req.body.email_id.toLowerCase(),
                                username:data,
                                referral_code:refferalCode,
                                referral_by: (typeof req.body.referral_by == undefined) ? '' : req.body.referral_by,
                                is_blocked: 0,
                            });

                            _userModel.save(function(error, userData, numAffected) {
                                if (error) {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 402
                                    }, 'Error saving user');
                                    callback(true, myErr);
                                } else {
                                    callback(error, userData);
                                }
                            });
                        }

                    })
                    
                });
            }
        });
    } else {
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'User Public Address is required');
        callback(true, myErr);
    }
}

exports.createRandomUserName = function(count, callback) {

    var item1 = config.uniqueName1[Math.floor(Math.random() * config.uniqueName1.length)];
    var item2 = config.uniqueName2[Math.floor(Math.random() * config.uniqueName2.length)];
    var item3 = config.uniqueName3[Math.floor(Math.random() * config.uniqueName3.length)];
    var item4 = Math.floor(Math.random() * (config.uniqueName4[1] - config.uniqueName4[0]) + config.uniqueName4[0]);

    var _username = item1+item2+item3+item4;
    var _totalCombination = config.uniqueName1.length*config.uniqueName2.length*config.uniqueName3.length*99

    Users.findOne({username: _username.toString()},function(err, results) {
        if (err) {
            console.log("unique username error", error);
            callback(true, err);
        }else if (results){
            count = count+1;
            
            if (count < _totalCombination){

                console.log("Repeated name found");
                exports.createRandomUserName(count, callback); 
            }else {

                console.log("all unique name exhausted");
                callback(true, "all unique username exhausted");
            }
            
        }else {
            console.log("unique username", _username);
            callback(false, _username);

        }
    });

}


exports.checkUserAthentication = function(publicAddress, signature, nonce, callback) {
    
    const msg = `I am signing to DAPPX with my one-time random number: ${nonce}`;

    const msgBufferHex = ethJSUtil.bufferToHex(Buffer.from(msg, 'utf8'));

    try {

        const address = ethSignUtil.recoverPersonalSignature({
            data: msgBufferHex,
            sig: signature,
        }); 

        if (address.toLowerCase() === publicAddress.toLowerCase()) {

            exports.updateNonce(publicAddress, function(error, result) {
              if (error) {
                   callback(error, result); 
               }else {
                    callback(false, result);
               }

            })

        } else {
            var myErr = new customErrors.UnauthorizedError({
                statusCode: 401
            }, 'Wrong user credentials');
            callback(true, myErr);
        }

    }catch(error) {

        var myErr = new customErrors.UnauthorizedError({
            statusCode: 401
        }, 'UnauthorizedError');
        callback(true, myErr);
    }
    

}


exports.updateNonce = function(publicAddress, callback) {

    const updatedDetails = {};
    updatedDetails.nonce = uuid.v4();
    Users.findOneAndUpdate({ public_address: publicAddress, is_blocked: 0 }, updatedDetails, (error, user) => callback(error, user));
}

exports.changeAccount = function(publicAddress, callback) {

    Users.findOne({public_address: publicAddress}
    , '_id', function(err, results) {
        // console.log("results", results)
        if (results) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Account already exists');
            callback(myErr, results);
        } else {
            var referralCode = exports.generateRefferalCode(function(refferalCode) {
                let _userModel = new Users({
                    public_address: publicAddress,
                    nonce: uuid.v4(),
                    referral_code:refferalCode,
                    is_blocked: 0,
                });

                _userModel.save(function(error, userData, numAffected) {
                    if (error) {
                        var myErr = new customErrors.PreconditionFailedError({
                            statusCode: 402
                        }, 'Error saving user');
                        callback(error, myErr);
                    } else {
                        callback(false, userData);
                    }
                });
            });
        }
    });
}



/*exports.createAccount = function(req, callback) {
    if(req.body.email_id && req.body.password) {
        Users.findOne({
            email_id: req.body.email_id.toLowerCase()
        }, '_id', function(err, results) {
            // console.log("results", results)
            if (results) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Account already exists');
                callback(true, myErr);
            } else {
                var referralCode = exports.generateRefferalCode(function(refferalCode) {
                    let _userModel = new Users({
                        email_id: req.body.email_id.toLowerCase(),
                        full_name: (typeof req.body.full_name == undefined) ? '' : req.body.full_name,    
                        country: (typeof req.body.country == undefined) ? '' : req.body.country,   
                        ethereum_wallet: (typeof req.body.ethereum_wallet == undefined) ? '' : req.body.ethereum_wallet, 
                        pando_wallet: (typeof req.body.pando_wallet == undefined) ? '' : req.body.pando_wallet,          
                        verify_token: uuid.v4(),
                        referral_code:refferalCode,
                        device_id:req.body.android_device_id,
                        referral_by: (typeof req.body.referral_by == undefined) ? '' : req.body.referral_by,
                        activated: true,
                    });

                    _userModel.save(function(error, userData, numAffected) {
                        if (error) {
                            var myErr = new customErrors.PreconditionFailedError({
                                statusCode: 402
                            }, 'Error saving user');
                            callback(true, myErr);
                        } else {
                            let _salt = exports.saltAndHash(req.body.password, function(salt, encryptedPassword) {
                                let _passwordSalt = new UsersPassword({
                                    user_id: userData.id,
                                    user_password: encryptedPassword,
                                    salt: salt,
                                });
                                _passwordSalt.save(function(error, userData, numAffected) {
                                    callback(error, userData);
                                });
                            })
                        }
                    });
                });
            }
        });
    } else {
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'Username and Password Required');
        callback(true, myErr);
    }
}*/

exports.editAccount = function(req, publicAddress, callback) { 
    let { email, username } = req.body;
    const updatedDetails = {};

    if (username != '') {

        Users.findOne({
            username: username 
        }, function(err, results) {
            if (results) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Username already exist');
                callback(myErr, results)

            }else {
                updatedDetails.username = username;
                updatedDetails.email_id = email;
                Users.findOneAndUpdate({ public_address: publicAddress }, updatedDetails, (error, user) => callback(error, user));
            }

        });

    }
}

exports.updateUserImage = function(publicAddress, imageName, imagePath, callback) { 
    const updatedDetails = {};

    Users.findOne({
        public_address: publicAddress 
    }, function(err, results) {
        if (!results) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'User not exist');
            callback(myErr, results)

        }else {

            if (results.image != '') { //remove old if available
                console.log("old image deleted", imagePath+results.image);
                fs.unlink(imagePath+results.image, function(err) {

                    updatedDetails.image = imageName;
                    Users.findOneAndUpdate({ public_address: publicAddress }, updatedDetails, (error, user) => callback(error, user));
       

                })
            }

        }

    });

}

exports.createOrder = function(req, callback) {

    //fetch the price and store it with orders to match with actuals
    console.log("Oracle service called- Fetch Order Price");
    Request.post({
        "headers": {
            "content-type": "application/json"
        },
        "url": config.externalURLs.packageURL + "/getpackageprice",
        "body": JSON.stringify({
            "project_id": req.body.project_id,
            "package_id": req.body.package_id
        })
    }, (error, response, body) => {
        let _result = JSON.parse(response.body);
        if (_result.error) {
            console.dir("Error in fetching package price", _result.error);
            callback(true, "Error in fetching package price");
        } else {

            let _result = JSON.parse(body);
            console.log("Price Fetched", _result.results);
            if (!_result.results.data.price.ETH.amount)  {

                callback(true, "INVALID PACKAGE ID WITHOUT PRICE");

            } else {

                req.body.price = Web3Utils.toWei(_result.results.data.price.ETH.amount.toString(), 'ether');
                
                let _userOrders = new UserOrders(req.body);

                _userOrders.validate(function(err) {
                    if (err)
                        callback(true, err);
                    else {

                        _userOrders.save(function(error, userData, numAffected) {
                            if (error) {1                    
                                callback(true, error);
                            } else {
                                callback(error, userData);
                            }
                        });

                    }
                        
                });

            }
      
        }
        //console.dir(JSON.parse(body));
    });


    
}

exports.getUserOrders = function(req, callback) {

    console.log("loaded session publicAddress is:--->", req.session.publicAddress);
    UserOrders.find({
        wallet_address: { $regex : new RegExp(req.session.publicAddress, "i") } 
        //$and : [{'public_address': req.session.public_address}, {'status':'success'}]
    }, function(err, results) {
        callback(err, results);
    });
}

exports.getUserOrdersByPackageId = function(req, callback) {

    UserOrders.find({
        package_id: req.body.package_id 
        //$and : [{'public_address': req.session.public_address}, {'status':'success'}]
    }, function(err, results) {
        callback(err, results);
    });
}

exports.updateOrderStatus = function(req, callback) {

    let _userOrderStatus = {};
    try {
        UserOrders.findOne({_id: getObjectId(req.body.order_id)}, function(err, results) {
            if (err) {
                callback(true, err)
            }else {

                if (results.price != req.body.paid_amount) {

                    _userOrderStatus.order_validity = false;
                    _userOrderStatus.price = results.price;
                }else {
                    _userOrderStatus.order_validity = true;
                    _userOrderStatus.price = req.body.paid_amount;

                }

                
                _userOrderStatus.counter = req.body.counter;
                _userOrderStatus.order_status = 'success';
                _userOrderStatus.tx_hash = req.body.tx_hash;
                _userOrderStatus.wallet_address = req.body.wallet_address;
                _userOrderStatus.updatedAt = Date.now()

                UserOrders.findOneAndUpdate({ _id: getObjectId(req.body.order_id) }, _userOrderStatus, (error, user) => callback(error, user));


            }
        })
    }catch(error) {

        callback(true, error);
    }
}

exports.getUserProfile = function(publicAddress, callback) { 
 
    Users.findOne({
        public_address: publicAddress 
    }, 'public_address email_id username referral_code referral_by image', function(err, results) {
        callback(err, results);

    });
}

exports.forgetPassword = function(req, callback) {
    console.log(req.body.email_id);
    Users.findOne({
        email_id: req.body.email_id.toLowerCase(), is_deleted: 0
    }, '_id email_id activated', function(err, results) {
        // console.log("results", results._id)
        let userObj = results;
        if (results) {
            const emailAddress = req.body.email_id.toLowerCase();

            exports.hasValidOtp(emailAddress, results._id, true, true, true, (error, userHasValidOtp) => {
                if(error) {
                    callback(true, userHasValidOtp);
                } else {
                    if(userHasValidOtp) {
                        callback(false, userObj);
                    } else {
                        var userID = results._id;
                        var OTP = Math.floor(100000 + Math.random() * 900000);
                        UsersOTP.findOne({
                            user_id: userID
                        }, '_id', function(err, resultsOTP) {
                            if (resultsOTP) {
                                var userOTPID = resultsOTP._id;
                                console.log("if otp", OTP,resultsOTP._id)
                                // let _salt = exports.saltAndHash(OTP, function(salt, encryptedOTP) {
                                let _otpModel = {
                                    user_otp: OTP,
                                    otp_expiry: Date.now() + OTP_VALIDITY,
                                    is_active:true
                                };

                                UsersOTP.updateOne({_id:userOTPID},_otpModel,function(error, userOTPData, numAffected) { 
                                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                                        if(error){
                                            var myErr = new customErrors.PreconditionFailedError({
                                                statusCode: 402
                                            }, 'Email didn\'t send');
                                            callback(true, myErr);
                                        }else{
                                            var mailOptions = {
                                                from: 'info@pandobrowser.com',
                                                to: emailAddress,
                                                subject: 'OTP from Pando',
                                                html: data.replace("{OTP}",OTP)
                                            };
                    
                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log(`Email sent to ${emailAddress}: ${info.response}`);
                                                }
                                            });
                                            callback(false, userObj);
                                        }
                                    });
                                });
                            } else {  
                                let _otpModel = new UsersOTP({
                                    user_id: userID,
                                    user_otp: OTP,
                                    otp_expiry: Date.now() + OTP_VALIDITY,
                                    is_active:true
                                });

                                _otpModel.save(function(error, userOTPData, numAffected) {
                                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                                        if(error) {
                                            var myErr = new customErrors.PreconditionFailedError({
                                                statusCode: 402
                                            }, 'Email didn\'t send');
                                            callback(true, myErr);
                                        } else {
                                            var mailOptions = {
                                                from: 'info@pandobrowser.com',
                                                to: emailAddress,
                                                subject: 'OTP from Pando',
                                                html: data.replace("{OTP}",OTP)
                                            };

                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log(`Email sent to ${emailAddress}: ${info.response}`);
                                                }
                                            });
                                            callback(false, userObj);
                                        }
                                    });
                                });
                                // })  
                            }
                        });
                    }
                }
            });
        } else {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Account not exists');
            callback(true, myErr);
        }
    });
}

exports.changePassword = function(req, callback) {
    // console.log("req.session inner==::",req.session.email_id);
    if(req.body.password===req.body.confirm_password){
        Users.findOne({
            email_id: req.session.email_id, is_deleted: 0
        }, '_id', function(err, results) {
            // console.log("results", results._id)
            if (results) {
                var userID = results._id;
                UsersPassword.findOne({
                    user_id: userID
                }, '_id', function(err, resultsPass) {

                    if (resultsPass) {
                        var userPassID = resultsPass._id;
                        let _salt = exports.saltAndHash(req.body.password, function(salt, encryptedPassword) {
                            let _passModel = {
                                user_password: encryptedPassword,
                                salt: salt,
                            };
                            UsersPassword.updateOne({_id:userPassID},_passModel,function(error, userPassData, numAffected) {                            
                                callback(error, userPassData);
                            });
                        })
                        // callback(true, myErr);
                    } else {  
                        let _salt = exports.saltAndHash(req.body.password, function(salt, encryptedPassword) {
                            let _passModel = new UsersPassword({
                                user_id: userID,
                                user_password: encryptedPassword,
                                salt: salt,
                            });
                            _passModel.save(function(error, userPassData, numAffected) {
                                callback(error, userPassData);
                            });
                        })  
                    }               
                });

            } else {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Account not exists');
                callback(true, myErr);
            }
        });
    }else{
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'Password does not match');
        callback(true, myErr);
    }   
}

exports.changePasswordV2 = function(req, callback) {
    // console.log("req.session inner==::",req.session.email_id);
    if(req.body.old_password){
        if(req.body.password===req.body.confirm_password){
            Users.findOne({
                email_id: req.session.email_id, is_deleted: 0
            }, '_id', function(err, results) {
                // console.log("results", results._id)
                if (results) {
                    var userID = results._id;
                    UsersPassword.findOne({
                        user_id: userID
                    }, function(err, resultsPass) {
                        if (resultsPass) {
                            // check old password here
                            exports.validatePassword(req.body.old_password, resultsPass.user_password, resultsPass.salt, function(validated) {
                                if(validated){
                                    var userPassID = resultsPass._id;
                                    let _salt = exports.saltAndHash(req.body.password, function(salt, encryptedPassword) {
                                        let _passModel = {
                                            user_password: encryptedPassword,
                                            salt: salt,
                                        };
                                        UsersPassword.updateOne({_id:userPassID},_passModel,function(error, userPassData, numAffected) {                            
                                            callback(error, userPassData);
                                        });
                                    })
                                } else {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 402
                                    }, 'Incorrect old password');
                                    callback(true, myErr);
                                }
                            });
                            // callback(true, myErr);
                        } else {  
                            let _salt = exports.saltAndHash(req.body.password, function(salt, encryptedPassword) {
                                let _passModel = new UsersPassword({
                                    user_id: userID,
                                    user_password: encryptedPassword,
                                    salt: salt,
                                });
                                _passModel.save(function(error, userPassData, numAffected) {
                                    callback(error, userPassData);
                                });
                            })  
                        }       
                    });

                } else {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'Account not exists');
                    callback(true, myErr);
                }
            });
        }else{
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Password does not match');
            callback(true, myErr);
        }
    } else {
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'Missing parameter - old password');
        callback(true, myErr);
    }
}

exports.verifyOTP = function(req, callback){
    // console.log("req.session inner==::",req.session.email_id);
    Users.findOne({
        email_id: req.session.email_id, is_deleted: 0
    }, '_id  email_id activated', function(err, results) {
        // console.log("login===::",results);
        let userObj = results
        if(results){
            if (results.activated) {
                UsersOTP.findOne({
                    user_id: results._id,
                    is_active:true
                }, function(err, resultsOTP) {
                    if (resultsOTP) {
                        exports.validateOTP(req.body.otp, resultsOTP.user_otp, function(validated) {
                            if (validated) {
                                if(parseFloat(Date.now()) > resultsOTP.otp_expiry) {
                                    var myErr = new customErrors.UnauthorizedError({
                                        statusCode: 401
                                    }, 'OTP Expired');
                                    callback(true, myErr);
                                } else {
                                    _userOTP = {
                                        is_active:false
                                    }
                                    UsersOTP.updateOne({_id: resultsOTP._id},_userOTP,function(err,status){});
                                    callback(false, userObj);
                                }
                            } else {
                                var myErr = new customErrors.UnauthorizedError({
                                    statusCode: 401
                                }, 'OTP is not validated');
                                callback(true, myErr);
                            }
                        });
                    } else {
                        var myErr = new customErrors.UnauthorizedError({
                            statusCode: 401
                        }, 'OTP is not validated');
                        callback(true, myErr);
                    }
                });
            } else {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 412
                }, 'Account is not activated yet');
                callback(true, myErr);
            }
        } else {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Account not exists');
            callback(true, myErr);
        }
    });
}

exports.forgotDeviceID = function(req, callback) {

    Users.findOne({
        email_id: req.body.email_id.toLowerCase(), is_deleted: 0
    }, '_id email_id activated', function(err, results) {
        // console.log("results", results._id)
        let userObj = results;
        if (results) {
            const emailAddress = req.body.email_id.toLowerCase();

            exports.hasValidOtp(emailAddress, results._id, true, true, true, (error, userHasValidOtp) => {
                if(error) {
                    callback(true, userHasValidOtp);
                } else {
                    if(userHasValidOtp) {
                        callback(false, userObj);
                    } else {
                        var userID = results._id;
                        var OTP = Math.floor(100000 + Math.random() * 900000);
                        UsersOTP.findOne({
                            user_id: userID
                        }, '_id', function(err, resultsOTP) {
                            if (resultsOTP) {
                                var userOTPID = resultsOTP._id;
                                console.log("if otp", OTP,resultsOTP._id)
                                // let _salt = exports.saltAndHash(OTP, function(salt, encryptedOTP) {
                                let _otpModel = {
                                    user_otp: OTP,
                                    otp_expiry: Date.now() + OTP_VALIDITY,
                                    is_active:true
                                };

                                UsersOTP.updateOne({_id:userOTPID},_otpModel,function(error, userOTPData, numAffected) { 

                                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                                        if(error){
                                            var myErr = new customErrors.PreconditionFailedError({
                                                statusCode: 402
                                            }, 'Email didn\'t send');
                                            callback(true, myErr);
                                        }else{
                                            var mailOptions = {
                                                from: 'info@pandobrowser.com',
                                                to: emailAddress,
                                                subject: 'OTP from Pando',
                                                html: data.replace("{OTP}",OTP)
                                            };
                    
                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log(`Email sent to ${emailAddress}: ${info.response}`);
                                                }
                                            });
                                            callback(false, userObj);
                                        }
                                    });
                                });
                            } else {  
                                let _otpModel = new UsersOTP({
                                    user_id: userID,
                                    user_otp: OTP,
                                    otp_expiry: Date.now() + OTP_VALIDITY,
                                    is_active:true
                                });

                                _otpModel.save(function(error, userOTPData, numAffected) {
                                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                                        if(error) {
                                            var myErr = new customErrors.PreconditionFailedError({
                                                statusCode: 402
                                            }, 'Email didn\'t send');
                                            callback(true, myErr);
                                        } else {
                                            var mailOptions = {
                                                from: 'info@pandobrowser.com',
                                                to: emailAddress,
                                                subject: 'OTP from Pando',
                                                html: data.replace("{OTP}",OTP)
                                            };

                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log(`Email sent to ${emailAddress}: ${info.response}`);
                                                }
                                            });
                                            callback(false, userObj);
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            });
        } else {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Account not exists');
            callback(true, myErr);
        }
    });
}

exports.updateDeviceId = function(req, callback) {

    let _userModel = {
        device_id: req.body.android_device_id,
    };
    Users.updateOne({email_id:req.body.email, is_deleted: 0}, _userModel, function(error, userData, numAffected) { 
        console.log("data", error, userData);                           
        callback(error, userData);
    });
}

exports.validateAccountCredentials = function(req, callback) {
    let { device_id, username } = req.body;
    let query = { email_id: username.toLowerCase(), is_deleted: 0 };

    Users.findOne(query, function(err, account) {
        if (!account) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Account not exists');
            callback(true, myErr);  
            return ;
        }

        if(!account.activated || account.is_deleted == 1) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 412
            }, 'Account is not activated yet');
            callback(true, myErr);

            return;
        }

        UsersPassword.findOne({
            user_id: account._id
        }, function(err, result) {
            if (result) {
                exports.validatePassword(req.body.password, result.user_password, result.salt, function(validated) {
                    if (validated) {
                        exports.getElapsedTime(account._id.toString(), function(err, result){
                            delete result.user_id;                                
                            callback(false, account, result);
                        })
                    } else {
                        var myErr = new customErrors.UnauthorizedError({
                            statusCode: 401
                        }, 'Account is not validated');
                        callback(true, myErr);
                    }
                });
            }
        });
    });
}

exports.validateAccountCredentialsV2 = function(req, callback) {
    let { device_id, username } = req.body;

    if(username) {
        let query = { email_id: username.toLowerCase(), is_deleted: 0 };

        Users.findOne(query, function(err, account) {
            if (!account) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 402
                }, 'Account not exists');
                callback(true, myErr);  
                return ;
            }
            
            if(Utils.isEmpty(device_id)) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 400
                }, 'Invalid device Id');
                callback(true, myErr);  
                return ;
            }
            
            if (Utils.isEmpty(account.device_id)){
                account.device_id = device_id;
                Users.findOneAndUpdate(query, { device_id }, (error, result) => {
                    console.log('Update device id', error, result._id);
                });
            }

            if(!account.activated || account.is_deleted == 1) {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 412
                }, 'Account is not activated yet');
                callback(true, myErr);

                return;
            }
            
            UsersPassword.findOne({
                user_id: account._id
            }, function(err, result) {
                if (result) {
                    exports.validatePassword(req.body.password, result.user_password, result.salt, function(validated) {
                        if (validated) {
                            exports.getElapsedTime(account._id.toString(), function(err, earnings){
                                delete result.user_id;
                                //get Plan details
                                exports.getPlanDetails(account._id.toString(), function(err, plan_details){
                                    let newDevice = false;

                                    if (!Utils.isEmpty(account.device_id) && account.device_id != device_id){
                                        newDevice = true;
                                    }
                                    
                                    callback(false, account, earnings, plan_details, newDevice);
                                });
                            });
                        } else {
                            var myErr = new customErrors.UnauthorizedError({
                                statusCode: 401
                            }, 'Account is not validated');

                            callback(true, myErr);
                        }
                    });
                }
            });
        });
    } else {
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'Invalid username');
        callback(true, myErr);
    }
}

exports.generateAndSendOTP = function(email_id, user_id, callback) {
    var userID = user_id;
    var OTP = Math.floor(100000 + Math.random() * 900000);

    UsersOTP.findOne({
        user_id: userID
    }, '_id', function(err, resultsOTP) {
        if (resultsOTP) {
            var userOTPID = resultsOTP._id;

            let _otpModel = {
                user_otp: OTP,
                otp_expiry: Date.now() + OTP_VALIDITY,
                is_active:true
            };

            UsersOTP.updateOne({ _id: userOTPID }, _otpModel,function(error, userOTPData, numAffected) {
                if(error) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'Failed to generate OTP');
                    callback(true, myErr);
                } else {
                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                        if(error){
                            var myErr = new customErrors.PreconditionFailedError({
                                statusCode: 402
                            }, 'Failed to send OTP to E-mail');
                            callback(true, myErr);
                        } else {
                            var mailOptions = {
                                from: 'info@pandobrowser.com',
                                to: email_id,
                                subject: 'OTP from Pando',
                                html: data.replace("{OTP}",OTP)
                            };

                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 402
                                    }, 'Failed to send OTP to E-mail');
                                    callback(true, myErr);
                                } else {
                                    console.log(`Email sent to ${email_id}: ${info.response}`);
                                    callback(false, true);
                                }
                            });
                        }
                    });
                }
            });
        } else {  
            let _otpModel = new UsersOTP({
                user_id: userID,
                user_otp: OTP,
                otp_expiry: Date.now() + OTP_VALIDITY,
                is_active: true
            });

            _otpModel.save((error, result) => {
                if(error) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'Failed to generate OTP');
                    callback(true, myErr);
                } else {
                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                        if(error){
                            var myErr = new customErrors.PreconditionFailedError({
                                statusCode: 402
                            }, 'Failed to send OTP to E-mail');
                            callback(true, myErr);
                        } else {
                            var mailOptions = {
                                from: 'info@pandobrowser.com',
                                to: email_id,
                                subject: 'OTP from Pando',
                                html: data.replace("{OTP}",OTP)
                            };

                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 402
                                    }, 'Failed to send OTP to E-mail');
                                    callback(true, myErr);
                                } else {
                                    console.log(`Email sent to ${email_id}: ${info.response}`);
                                    callback(false, true);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.verifyOtpForLogin = function(user_id, otp, callback) {
    UsersOTP.findOne({
        user_id: user_id,
        is_active: true
    }, function(err, resultsOTP) {
        if (resultsOTP) {
            exports.validateOTP(otp, resultsOTP.user_otp, function(validated) {
                if (validated) {
                    if(parseFloat(Date.now()) > resultsOTP.otp_expiry) {
                        var myErr = new customErrors.UnauthorizedError({
                            statusCode: 401
                        }, 'OTP Expired');
                        callback(true, myErr);
                    } else {
                        //update OTP
                        let _userOTP = {
                            is_active: false
                        }
                        UsersOTP.updateOne({ _id: resultsOTP._id }, _userOTP, function(err,status){});
                        callback(false, true);
                    }
                } else {
                    var myErr = new customErrors.UnauthorizedError({
                        statusCode: 401
                    }, 'Invalid OTP');
                    callback(true, myErr);
                }
            });
        } else {
            var myErr = new customErrors.UnauthorizedError({
                statusCode: 401
            }, 'Invalid OTP');
            callback(true, myErr);
        }
    });
}

exports.hasValidOtp = function(email_id, user_id, resendEmail, resetExpiry, hardResend, callback) {
    UsersOTP.findOne({
        user_id: user_id,
        is_active: true
    }, function(err, resultsOTP) {
        if (resultsOTP) {
            if(parseFloat(Date.now()) < resultsOTP.otp_expiry) { // still valid
                if(resendEmail) {
                    const lastResend = resultsOTP.last_resend;
                    if(lastResend) {
                        const timeDiff = parseFloat((new Date()).getTime() - lastResend.getTime());
                        if(timeDiff < RESEND_BUFFER) { // do not resend
                            if(!hardResend){
                                callback(false, true);
                                return;
                            }
                        }
                    }

                    if(resetExpiry) {
                        const newExpiry = Date.now() + OTP_VALIDITY;
                        UsersOTP.updateOne({ _id: resultsOTP._id }, { $set: { otp_expiry: newExpiry } }, (error, updateOtpExpiryResult) => {
                        });
                    }

                    fs.readFile('./public/opt-email.html',"utf8", function (error, data) {
                        if(error){
                            var myErr = new customErrors.PreconditionFailedError({
                                statusCode: 402
                            }, 'Failed to send OTP to E-mail');
                            callback(true, myErr);
                        } else {
                            var mailOptions = {
                                from: 'info@pandobrowser.com',
                                to: email_id,
                                subject: 'OTP from Pando',
                                html: data.replace("{OTP}", resultsOTP.user_otp)
                            };

                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 402
                                    }, 'Failed to send OTP to E-mail');
                                    callback(true, myErr);
                                } else {
                                    // update last resend
                                    UsersOTP.updateOne({ _id: resultsOTP._id }, { $set: { last_resend: new Date() } }, (error, updateOtpLastResendResult) => {
                                    });

                                    console.log(`Email sent to ${email_id}: ${info.response}`);
                                    callback(false, true);
                                }
                            });
                        }
                    });
                } else {
                    if(resetExpiry) {
                        const newExpiry = Date.now() + OTP_VALIDITY;
                        UsersOTP.updateOne({ _id: resultsOTP._id }, { $set: { otp_expiry: newExpiry } }, (error, updateOtpExpiryResult) => {
                        });
                    }
                    callback(false, true);
                }
            } else {
                callback(false, false);
            }
        } else {
            callback(false, false);
        }
    });
}

exports.resendOtp = function(email_id, callback) {
    Users.findOne({ email_id }, (error, user) => {
        if(error) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 404
            }, 'Account not exists');
            callback(true, myErr);
        } else {
            if(user) {
                exports.hasValidOtp(email_id, user._id, true, true, false, (error, userHasValidOtp) => {
                    if(error) {
                        callback(true, userHasValidOtp);
                    } else {
                        if(userHasValidOtp) {
                            callback(false, true);
                        } else {
                            exports.generateAndSendOTP(email_id, user._id, (error, result) => {
                                if(error) {
                                    callback(true, result);
                                } else {
                                    callback(false, true);
                                }
                            });
                        }
                    }
                });
            } else {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 404
                }, 'Account not exists');
                callback(true, myErr);  
            }
        }
    });
}

exports.validateAccountCredentialsV3 = function(req, callback) {
    if(req.body){
        let { device_id, username, otp } = req.body;

        if(username) {
            let query = { email_id: username.toLowerCase(), is_deleted: 0 };

            Users.findOne(query, function(err, account) {
                if (!account) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'Account not exists');
                    callback(true, false, myErr);  
                    return;
                }
                
                if(Utils.isEmpty(device_id)) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 400
                    }, 'Invalid device Id');
                    callback(true, false, myErr);  
                    return;
                }
                
                if (Utils.isEmpty(account.device_id)){
                    account.device_id = device_id;
                    Users.findOneAndUpdate(query, { device_id }, (error, result) => {
                        console.log('Update device id', error, result._id);
                    });
                }

                if(!account.activated || account.is_deleted == 1) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 412
                    }, 'Account is not activated yet');
                    callback(true, false, myErr);
                    return;
                }

                const user_id = account._id;
                
                UsersPassword.findOne({
                    user_id: account._id
                }, function(err, result) {
                    if (result) {
                        exports.validatePassword(req.body.password, result.user_password, result.salt, function(validated) {
                            if (validated) {
                                if(otp) {
                                    // validate OTP
                                    exports.verifyOtpForLogin(user_id, otp, (error, result) => {
                                        if(error) {
                                            callback(true, false, result);
                                        } else {
                                            exports.getElapsedTime(account._id.toString(), function(err, earnings){
                                                if(err) {
                                                    callback(true, false, earnings);
                                                } else {
                                                    //delete result.user_id;
                                                    //get Plan details
                                                    exports.getPlanDetails(account._id.toString(), function(err, plan_details){
                                                        let newDevice = false;

                                                        if (!Utils.isEmpty(account.device_id) && account.device_id != device_id){
                                                            newDevice = true;
                                                        }
                                                        
                                                        callback(false, newDevice, account, earnings, plan_details);
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    let newDevice = false;

                                    if (!Utils.isEmpty(account.device_id) && account.device_id != device_id){
                                        newDevice = true;
                                    }

                                    if(newDevice) {
                                        var myErr = new customErrors.UnauthorizedError({
                                            statusCode: 403
                                        }, 'Proceed to OTP');
                                        callback(true, newDevice, myErr);
                                    } else {
                                        exports.hasValidOtp(username.toLowerCase(), user_id, true, true, true, (error, userHasValidOtp) => {
                                            if(error) {
                                                callback(true, false, userHasValidOtp);
                                            } else {
                                                if(userHasValidOtp) {
                                                    var myErr = new customErrors.UnauthorizedError({
                                                        statusCode: 403
                                                    }, 'Proceed to OTP');
                                                    callback(true, false, myErr);
                                                } else {
                                                    exports.generateAndSendOTP(username.toLowerCase(), user_id, (error, result) => {
                                                        if(error) {
                                                            callback(true, false, result);
                                                        } else {
                                                            var myErr = new customErrors.UnauthorizedError({
                                                                statusCode: 403
                                                            }, 'Proceed to OTP');
                                                            callback(true, false, myErr);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            } else {
                                var myErr = new customErrors.UnauthorizedError({
                                    statusCode: 401
                                }, 'Incorrect Password');
                                callback(true, false, myErr);
                            }
                        });
                    } else {
                        var myErr = new customErrors.UnauthorizedError({
                            statusCode: 401
                        }, 'Incorrect Password');
                        callback(true, false, myErr);
                    }
                });
            });
        } else {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Invalid Username');
            callback(true, false, myErr);
        }
    } else {
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 402
        }, 'Bad request');
        callback(true, false, myErr);
    }
}

exports.verifyReferralCode = function(req,callback){
    Users.findOne({referral_code:req.body.referral_by,is_blocked:0},function(err,result){
        if(result==null){
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Invalid referral code. Please try again.');
            callback(true, myErr);  
            return 
        }else{
            callback(false, {msg:"success",isValid:true }); 
        }
    })
}

exports.getAllReferredUser = function(req, callback){
    console.log("refferal code", req.session.referral_code);
    Users.find({referral_by:req.session.referral_code, is_deleted: 0},'_id email_id full_name country activated',function(err,result){
        if(result==null){
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Referral code is invalid');
            callback(true, myErr);  
            return 
        }else{
            callback(false, {msg:"success",data:result }); 
        }
    })
}

exports.getDailyStatisticReferredUser = function(referralCode, from, to , callback){
    let query = {
        "referral_by": referralCode,
        "createdAt": {"$gte": from.toISOString(), "$lt": to.toISOString()}
    };

    Users.count(query, function(err, count){
        if(count == null){
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Referral code is invalid');
            callback(true, myErr);  
            return 
        }else{
            callback(false, count); 
        }
    })
}

exports.getStatisticRefUser = function(user_id, callback){
    RefStatistics.find({user_id}, 'user_id date no_ref', function(err, results){
        if(results == null){
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 402
            }, 'Referral code is invalid');
            callback(true, myErr);  
            return;
        }else{
            callback(false, results); 
        }
    })
}

exports.saveElapsedTime = function(req, callback){
    try {
        let { elapsed_time } = req.body;
        let { user_id, email_id } = req.session;

        console.log(`User ${email_id} submitted ${elapsed_time}`);
        if(!elapsed_time) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 400
            }, 'Invalid elapsed_time');
            callback(true, myErr);  
            return;
        }

        Settings.findOne({}, function (error, setting) {
            let commission_rate = 0;
            let referral_rate = 0;
            
            if(error || !setting) {
                console.log('Could not get setting from DB, apply setting from file setting');
                commission_rate = 0;
                referral_rate = 0;
            } else {
                commission_rate = setting._doc.commission_rate;
                referral_rate = setting._doc.referral_rate;
            }

            console.log(`Applied mining rate ${commission_rate} -> ref ${referral_rate}`);

            let earningMinute = parseInt(elapsed_time)/60;
            let pandoEarning = parseFloat(commission_rate)*earningMinute;
            let referralPandoEarning = pandoEarning*(referral_rate/100);
            let ret = { pandoEarning };

            console.log("calculated", earningMinute, pandoEarning, referralPandoEarning);

            let elapsedTime = {
                user_id,
                elapsed_time,
                mining_rate: commission_rate,
                elapsed_pando_earned: pandoEarning
            };

            Users.findOne({_id: user_id}, function (error, user) {
                if(error || !user) {
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 500
                    }, 'There are error in calculating earning');
                    callback(true, myErr);  
                    return;
                }

                if(user.referral_by) {
                    Users.findOne({'referral_code': user.referral_by}, function(error, result) {
                        elapsedTime.ref_user_id = result._id;
                        elapsedTime.ref_rate = referral_rate
                        elapsedTime.referral_pando_earned = referralPandoEarning;
    
                        _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                        _elapsedTimeModel.save(function(error, userData, numAffected) {
                            if(error) { console.log("There is error in saving earning", error); return; }
                            console.log("Saved earning for", elapsedTime.user_id, userData._doc);
                            callback(false, ret);
                        });
                    });
                } else {
                    _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                    _elapsedTimeModel.save(function(error, userData, numAffected) {
                        if(error) { 
                            console.log("There is error in saving earning", error); 
                            callback(true, error);
                            return; 
                        }
                        callback(false, ret);
                        console.log("Saved earning for", elapsedTime.user_id, userData._doc);
                    });
                }
            });
            
        });
    } catch (ex) {
        console.log("Error in saveElapsedTime", ex);
        callback(true,{});
    }
}

exports.saveElapsedTimeV2 = function(req, callback){
    try {
        let { elapsed_time } = req.body;
        let { user_id, email_id } = req.session;

        console.log(`User ${email_id} submitted ${elapsed_time}`);
        if(!elapsed_time) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 400
            }, 'Invalid elapsed_time');
            callback(true, myErr);
            return;
        }

        Settings.findOne({}, function (error, setting) {
            let commission_rate = 0;
            let referral_rate = 0;

            if(error || !setting) {
                console.log('Could not get setting from DB, apply setting from file setting');
                commission_rate = 0;
                referral_rate = 0;
            } else {
                commission_rate = setting._doc.commission_rate;
                referral_rate = setting._doc.referral_rate;
            }

            exports.getPlanDetails(user_id, function(error, plan){
                if(error){
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 500
                    }, 'There are error in calculating earning');
                    callback(true, myErr);
                    return;
                }

                let booster_rate = 0;
                let newRate = commission_rate;

                if(plan && plan.booster_rate){
                    booster_rate = plan.booster_rate;
                    newRate = commission_rate + plan.booster_rate;
                }

                console.log(`Applied mining rate ${commission_rate} -> booster rate ${booster_rate} -> ref ${referral_rate}`);

                let earningMinute = parseInt(elapsed_time)/60;

                let pandoEarning = parseFloat(newRate) * earningMinute;

                let baseRatePandoEarning = parseFloat(commission_rate) * earningMinute;
                let boosterPandoEarning = parseFloat(booster_rate) * earningMinute;

                let referralPandoEarning = baseRatePandoEarning * (referral_rate/100);

                let ret = { pandoEarning };

                console.log("calculated", earningMinute, pandoEarning, referralPandoEarning);

                let elapsedTime = {
                    user_id,
                    elapsed_time,
                    mining_rate: newRate,
                    elapsed_pando_earned: pandoEarning,
                    booster_rate: booster_rate,
                    booster_elapsed_pando_earned: boosterPandoEarning
                };

                Users.findOne({_id: user_id}, function (error, user) {
                    if(error || !user) {
                        var myErr = new customErrors.PreconditionFailedError({
                            statusCode: 500
                        }, 'There are error in calculating earning');
                        callback(true, myErr);  
                        return;
                    }

                    if(user.referral_by) {
                        Users.findOne({'referral_code': user.referral_by}, function(error, result) {
                            if(result) {
                                elapsedTime.ref_user_id = result._id;
                                elapsedTime.ref_rate = referral_rate
                                elapsedTime.referral_pando_earned = referralPandoEarning;
                            }

                            _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                            _elapsedTimeModel.save(function(error, userData, numAffected) {
                                if(error) { console.log("There is error in saving earning", error); return; }
                                console.log("Saved earning for", elapsedTime.user_id, userData._doc);
                                callback(false, ret);
                            });
                        });
                    } else {
                        _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                        _elapsedTimeModel.save(function(error, userData, numAffected) {
                            if(error) { 
                                console.log("There is error in saving earning", error); 
                                callback(true, error);
                                return; 
                            }
                            callback(false, ret);
                            console.log("Saved earning for", elapsedTime.user_id, userData._doc);
                        });
                    }
                });
            });
        });
    } catch (ex) {
        console.log("Error in saveElapsedTime", ex);
        callback(true,{});
    }
}

exports.saveElapsedTimeV2EncryptedPayload = function(req, elapsed_time, callback){
    try {
        let { user_id, email_id } = req.session;
        Utils.log(`User ${email_id} submitted ${elapsed_time}`);

        if(!elapsed_time) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 400
            }, 'Invalid elapsed_time');
            callback(true, myErr);
            return;
        }
        
        Settings.findOne({}, function (error, setting) {
            let commission_rate = 0;
            let referral_rate = 0;
    
            if(error || !setting) {
                console.log('Could not get setting from DB, apply setting from file setting');
                commission_rate = 0;
                referral_rate = 0;
            } else {
                commission_rate = setting._doc.commission_rate;
                referral_rate = setting._doc.referral_rate;
            }
    
            exports.getPlanDetails(user_id, function(error, plan){
                if(error){
                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 500
                    }, 'There are error in calculating earning');
                    callback(true, myErr);
                    return;
                }
    
                let booster_rate = 0;
                let newRate = commission_rate;
    
                if(plan && plan.booster_rate){
                    booster_rate = plan.booster_rate;
                    newRate = commission_rate + plan.booster_rate;
                }
    
                console.log(`Applied mining rate ${commission_rate} -> booster rate ${booster_rate} -> ref ${referral_rate}`);
    
                let earningMinute = parseInt(elapsed_time)/60;
    
                let pandoEarning = parseFloat(newRate) * earningMinute;
    
                let baseRatePandoEarning = parseFloat(commission_rate) * earningMinute;
                let boosterPandoEarning = parseFloat(booster_rate) * earningMinute;
    
                let referralPandoEarning = baseRatePandoEarning * (referral_rate/100);
    
                let ret = { pandoEarning };
    
                console.log("calculated", earningMinute, pandoEarning, referralPandoEarning);
    
                let elapsedTime = {
                    user_id,
                    elapsed_time,
                    mining_rate: newRate,
                    elapsed_pando_earned: pandoEarning,
                    booster_rate: booster_rate,
                    booster_elapsed_pando_earned: boosterPandoEarning
                };
    
                Users.findOne({_id: user_id}, function (error, user) {
                    if(error || !user) {
                        var myErr = new customErrors.PreconditionFailedError({
                            statusCode: 500
                        }, 'There are error in calculating earning');
                        callback(true, myErr);  
                        return;
                    }
    
                    if(user.referral_by) {
                        Users.findOne({'referral_code': user.referral_by}, function(error, result) {
                            if(result) {
                                elapsedTime.ref_user_id = result._id;
                                elapsedTime.ref_rate = referral_rate
                                elapsedTime.referral_pando_earned = referralPandoEarning;
                            }
    
                            _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                            _elapsedTimeModel.save(function(error, userData, numAffected) {
                                if(error) { 
                                    console.log("There is error in saving earning", error);
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 500
                                    }, 'There are error in calculating earning');
                                    callback(true, myErr);
                                } else {
                                    console.log("Saved earning for", email_id, userData.elapsed_pando_earned, userData.mining_rate);
                                    callback(false, ret);
                                }
                            });
                        });
                    } else {
                        _elapsedTimeModel = new UsersElapsedTime(elapsedTime);
                        _elapsedTimeModel.save(function(error, userData, numAffected) {
                            if(error) { 
                                console.log("There is error in saving earning", error); 
                                var myErr = new customErrors.PreconditionFailedError({
                                    statusCode: 500
                                }, 'There are error in calculating earning');
                                callback(true, myErr);
                            } else {
                                console.log("Saved earning for", email_id, userData.elapsed_pando_earned, userData.mining_rate);
                                callback(false, ret);
                            }
                        });
                    }
                });
            });
        });
        
    } catch (ex) {
        console.log("Error in saveElapsedTime", ex);
        var myErr = new customErrors.PreconditionFailedError({
            statusCode: 500
        }, 'There are error in calculating earning');
        callback(true, myErr);
    }
}


exports.calculateRefferalForElapsedTime = function(rowId, callback) {

    UsersElapsedTime.findOne({_id:rowId}, function(error, result) {
        if(error) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 404
            }, 'Record not found');
            callback(true, myErr);
        } else {
            

            callback(false, ret);
            // Levels.find({}, function(error, results) {

            //     results.forEach(lv => {
            //         ret[lv.level] = pandoEarning*lv.rate/100;
            //     });

            //     callback(false, ret);
            // });
        }
    });
}

//getElapsedTime
exports.getElapsedTime = function(user_id, callback) {
    // find withdrawals
    exports.getWithdrawnAmount(user_id, (error, withrawalInfo) => {
        if(error) {
            callback(true, withrawalInfo);
            return;
        }

        const withdrawn_succeed = withrawalInfo.withdrawn_succeed;
        const withdrawn_pending = withrawalInfo.withdrawn_pending;
        const withdrawn_new = withrawalInfo.withdrawn_new;

        // find earning
        UsersElapsedTime.aggregate([
            { $match: { user_id: user_id} },
            { $group: { _id: null, 
                elapsed_time: { $sum: "$elapsed_time" }, 
                elapsed_pando_earned: { $sum: "$elapsed_pando_earned" }
                }
            }
        ], function(err, result){
            let elapsed_time = result[0]?result[0].elapsed_time:0;
            let elapsed_pando_earned = result[0]?result[0].elapsed_pando_earned:0;

            PassiveMiningUserElapsedTimes.findOne({ user_id: user_id }, function(error, latestMiningLog){
                if(latestMiningLog) {
                    const elapsed_datetime_end = new Date();
                    latestMiningLog.elapsed_time = Math.round((elapsed_datetime_end.getTime() - latestMiningLog.elapsed_datetime.getTime()) / 1000);
                    latestMiningLog.elapsed_pando_earned = parseFloat(parseFloat(latestMiningLog.mining_rate) * (latestMiningLog.elapsed_time / 60));

                    PassiveMiningUserElapsedTimes.updateOne({ _id: latestMiningLog._id }, latestMiningLog, function(error, result) {
                        PassiveMiningUserElapsedTimes.aggregate([
                            { $match: { user_id: user_id} },
                            { $group: { _id: null, 
                                elapsed_time: { $sum: "$elapsed_time" }, 
                                elapsed_pando_earned: { $sum: "$elapsed_pando_earned" }
                                }
                            }
                        ], function(err, result){
                            let passive_mining_elapsed_time = result[0] ? result[0].elapsed_time : 0;
                            let passive_mining_elapsed_pando_earned = result[0] ? result[0].elapsed_pando_earned : 0;

                            // console.log(elapsed_time, elapsed_pando_earned);
                            // find ref earning
                            UsersElapsedTime.aggregate([
                                { $match: { ref_user_id: user_id} },
                                { $group: { _id: null, referral_pando_earned: { $sum: "$referral_pando_earned" }}
                                }
                            ], function(err, result){
                                let referral_pando_earned = result[0]?result[0].referral_pando_earned: 0.0;
                                console.log(elapsed_time, elapsed_pando_earned, referral_pando_earned);
                                callback(false, { user_id,
                                    elapsed_time,
                                    elapsed_pando_earned,
                                    passive_mining_elapsed_time,
                                    passive_mining_elapsed_pando_earned,
                                    referral_pando_earned,
                                    withdrawn_succeed,
                                    withdrawn_pending,
                                    withdrawn_new
                                });
                            });
                        });
                    });
                } else {
                    let passive_mining_elapsed_time = 0;
                    let passive_mining_elapsed_pando_earned = 0;

                    // console.log(elapsed_time, elapsed_pando_earned);
                    // find ref earning
                    UsersElapsedTime.aggregate([
                        { $match: { ref_user_id: user_id} },
                        { $group: { _id: null, referral_pando_earned: { $sum: "$referral_pando_earned" }}
                        }
                    ], function(err, result){
                        let referral_pando_earned = result[0]?result[0].referral_pando_earned: 0.0;
                        console.log(elapsed_time, elapsed_pando_earned, referral_pando_earned);
                        callback(false, { user_id,
                            elapsed_time,
                            elapsed_pando_earned,
                            passive_mining_elapsed_time,
                            passive_mining_elapsed_pando_earned,
                            referral_pando_earned,
                            withdrawn_succeed,
                            withdrawn_pending,
                            withdrawn_new
                        });
                    });
                }
            }).sort({ 'elapsed_datetime': -1 });
        });
    });
}

exports.getWithdrawnAmount = function(user_id, callback) {
    Withdrawal.aggregate([
        { $match: { user_id: user_id } },
        { $group: { _id: null, total_amount: { $sum: "$total_amount" } } }
    ], function(err, result){
        if(err) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 412
            }, 'Error calculating user total withdrawal');
            callback(true, myErr);
        } else {
            const withdrawn_succeed = result[0] ? result[0].total_amount : 0;
            const withdrawn_new = 0;
            const withdrawn_pending = 0;

            callback(false, { withdrawn_succeed, withdrawn_pending, withdrawn_new });
        }
    });
}

//getPlanDetails
exports.getPlanDetails = function(user_id, callback) {
    
    UserPlans.findOne({user_id:user_id}, function(error, user_plans) {
        if(error) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 404
            }, 'Record not found');
            callback(true, myErr);
        } else {
            if(user_plans){
                let plan_id = user_plans.purchased_plan_id;
                
                Plans.findById(plan_id, function(error, plan_details) {
                    if(error) {
                        var myErr = new customErrors.PreconditionFailedError({
                            statusCode: 404
                        }, 'Record not found');
                        callback(true, myErr);
                    } else {

                        //console.log("Final reocords are", user_plans, plan_details._doc);
                        let userPlan = {};
                        if(plan_details){
                            userPlan = plan_details._doc;
                        }

                        callback(false, userPlan);
                    }
                });
            } else {
                callback(false, {});
            }
        }
    }).sort({ 'createdAt': -1 });

}

exports.getUser = function(userId, callback) {
    Users.findOne({ _id: userId }, function(error, user) {
        if(error){
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 404
            }, 'Record not found');
            callback(true, myErr);
        } else {
            if(user){
                const userDoc = user._doc;
                delete userDoc.verify_token;
                userDoc.id = userDoc._id;
                callback(false, userDoc);             
            } else {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 404
                }, 'Record not found');
                callback(true, myErr);
            }
        }
    });
}

//getRefStats
exports.getRefStats = function(req, callback) {

    let start_date = new Date(parseInt(req.query.from));
    let end_date = new Date(parseInt(req.query.to));
    
    let query = {
        "user_id": req.session.user_id,
        "createdAt": {"$gte": start_date.toISOString(), "$lte": end_date.toISOString()}
    };

    RefStatistics.find(query, 'user_id email_id no_ref createdAt' ,function(err, result){

        if(err) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 500
            }, err);
            callback(true, myErr);
        }else {
            callback(false, {msg:"success",data:result});
        }
        
    })

}

exports.createSession = function(req, lastSubmit, callback) {
    const userId = req.body.user_id;

    Users.findById(userId, function(error, result) {
        if(error) {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 404
            }, 'User not found');
            callback(true, myErr);
        } else {
            if(result) {
                let resultObj = {};
                resultObj.email_id = result.email_id;
                resultObj.user_id = result._id;
                resultObj.referral_code = result.referral_code;
                resultObj.referral_by = result.referral_by;
                resultObj.device_id = result.device_id;
                resultObj.public_address = result.public_address;

                if(lastSubmit) {
                    resultObj.time = lastSubmit;
                    session.save(req.session.sid, resultObj, function(err, status) {
                        if (err) {
                            log.debug("Session data cannot be saved");
                            return next(err);
                        } else {
                            Utils.log(`session renew - ${userId}: session_time ${resultObj.time} - from memory`);

                            callback(false, { token: req.session.sid });
                        }
                    });
                } else {
                    exports.getLastSubmit(userId, function(error, lastSubmitFromDb) {
                        resultObj.time = lastSubmitFromDb ? ((lastSubmitFromDb.getTime() / 1000) - 30) : ((result.createdAt.getTime() / 1000) - 30);
                        session.save(req.session.sid, resultObj, function(err, status) {
                            if (err) {
                                log.debug("Session data cannot be saved");
                                return next(err);
                            } else {
                                Utils.log(`session renew - ${userId}: session_time ${resultObj.time} - from DB`);

                                callback(false, { token: req.session.sid });
                            }
                        });
                    });
                }
            } else {
                var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 404,
                }, 'User not found');
                callback(true, myErr);
            }
        }
    });
}

exports.getLastSubmit = function(userId, callback) {
    UsersElapsedTime.findOne({ user_id: userId.toString() })
        .sort({ _id: -1 })
        .then(lastEntry => {
            if(lastEntry) {
                callback(null, lastEntry.createdAt);
            } else {
                callback(null, null);
            }
        })
        .catch(error => {
            Utils.log(`session renew - ${userId}: ${error}`);
            callback(null, null);
        });
}
