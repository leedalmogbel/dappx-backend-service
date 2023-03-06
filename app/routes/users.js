/*jslint node: true */
'use strict';
let mongoose = require('mongoose');
let path = require('path');
let axios = require('axios');
let config = require(path.join(__dirname, '../../config/config'));
let helper = require(path.join(__dirname, '../common/helper'));
let Utils = require(path.join(__dirname, '../common/Utils'));
var uuid = require('uuid');
let Users = mongoose.model('Users');
let UsersPassword = mongoose.model('UsersPassword');
var AM = require('./modules/account-manager');
const fs = require('fs');
var request = require("request");
const customErrors = require('restify-errors');

const imagePath = path.join(__dirname, '../../public/images/');
const allowedImage = ["jpeg","png","jpg"];



let PATH = '/users';
let VERSION = '1.0.0';

const userMiningStatus = new Map();
const MAX_TIME_MINING_PERIOD = 60*60; // 1hour;

module.exports = function(server) {
    
    console.log("in route---------------");
    server.get({
        path: PATH + '/',
        version: VERSION
    }, getNonce);

    server.post({
        path: PATH + '/createAccount',
        version: VERSION
    }, createAccount);

    server.post({
        path: PATH + '/authentication',
        version: VERSION
    }, accountAthentication);

    server.get({
        path: PATH + '/sessionRefresh',
        version: VERSION
    }, sessionRefresh);
     
    server.get({
        path: PATH + '/logout',
        version: VERSION
    }, sessionDestroy);

    server.post({
        path: PATH + '/accountChanged',
        version: VERSION
    }, accountChanged);

    server.post({
        path: PATH + '/editProfile',
        version: VERSION
    }, editAccount);

    server.get({
        path: PATH + '/userProfile',
        version: VERSION
    }, userProfile);

    server.post({
        path: PATH + '/userImage',
        version: VERSION
    }, userImage);

    server.post({
        path: PATH + '/updateOrderStatus',
        version: VERSION
    }, updateOrderStatus);

    server.post({
        path: PATH + '/createOrder',
        version: VERSION
    }, createOrder);

    //getUserOrders
    server.post({
        path: PATH + '/getOrders',
        version: VERSION
    }, getUserOrders);

    //getMarketPrices
    server.get({
        path: PATH + '/getMarketPrices',
        version: VERSION
    }, getMarketPrices);

    server.post({
        path: PATH + '/getOrdersByPackageID',
        version: VERSION
    }, getOrdersByPackageID);

    /*server.post({
        path: PATH + '/fetchOrderPrice',
        version: VERSION
    }, fetchOrderPrice);*/

   /* server.post({
        path: PATH + '/userImage',
        version: VERSION
    }, uploadFile.single('file'), userImage.bind(this));*/

    /*server.post({
        path: PATH + '/createAccountV2',
        version: VERSION
    }, createAccountV2);

    server.post({
        path: PATH + '/createAccountV3',
        version: VERSION
    }, rateLimit, createAccountV3);

    server.post({
        path: PATH + '/editAccount',
        version: VERSION
    }, editAccount);

    server.get({
        path: PATH + '/sessionRefresh',
        version: VERSION
    }, sessionRefresh);

    server.post({
        path: PATH + '/createSession',
        version: VERSION
    }, createSession);

    server.get({
        path: PATH + '/sessionDestroy',
        version: VERSION
    }, sessionDestroy);

    server.get({
        path: PATH + '/myRefStatistics',
        version: VERSION
    }, getMyRefStatistic);

    server.post({
        path: PATH + '/forgetPassword',
        version: VERSION
    }, forgetPassword);
    server.post({
        path: PATH + '/verifylogin',
        version: VERSION
    }, verifylogin);
    server.post({
        path: PATH + '/verifyloginV2',
        version: VERSION
    }, verifyloginV2);
    server.post({
        path: PATH + '/verifyloginV3',
        version: VERSION
    }, verifyloginV3);
    server.post({
        path: PATH + '/verifyloginV4',
        version: VERSION
    }, rateLimit, verifyloginV4);
    server.post({
        path: PATH + '/verifyOTP',
        version: VERSION
    }, verifyOTP);
    server.post({
        path: PATH + '/changePassword',
        version: VERSION
    }, changePassword);
    server.post({
        path: PATH + '/changePasswordV2',
        version: VERSION
    }, changePasswordV2);
    server.get({
        path: PATH + '/verifyReferralCode/:refCode',
        version: VERSION
    }, verifyReferralCode);
    server.post({
        path: PATH + '/getAllReferredUser',
        version: VERSION
    }, getAllReferredUser);
    server.post({
        path: PATH + '/saveElapsedTime',
        version: VERSION
    }, saveElapsedTime);
    server.post({
        path: PATH + '/saveElapsedTimeV2',
        version: VERSION
    }, saveElapsedTimeV2);
    server.post({
        path: PATH + '/forgetDeviceId',
        version: VERSION
    }, forgetDeviceId);
    server.post({
        path: PATH + '/updateDeviceId',
        version: VERSION
    }, updateDeviceId);
    server.get({
        path: PATH + '/getElapsedTime',
        version: VERSION
    }, getElapsedTime);
    server.post({
        path: PATH + '/getUserPlanDetails',
        version: VERSION
    }, getUserPlanDetails);
    server.get({
        path: PATH + '/getDetails',
        version: VERSION
    }, getUserDetails);
    server.get({
        path: PATH + '/getRefStats',
        version: VERSION
    }, getRefStats);

    server.post({
        path: PATH + '/resendOTP',
        version: VERSION
    }, resendOtp);
*/
    function userImage(req, res, next) {

        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {

                var exts = req.files.file.name.split('.').pop()
                if (allowedImage.includes(exts)) {

                    let imageName = uuid.v4()+ '.' + exts;
                    fs.renameSync(
                       req.files.file.path,
                      `${imagePath}${imageName}`
                    );

                    AM.updateUserImage(data.publicAddress, imageName, imagePath, function(err, result) {

                        if (err) {

                            return next(myErr);
                        }else {
                            res.send(202, { message: 'File upload success' });
                        }
                    })

                    
                }else {

                    var myErr = new customErrors.PreconditionFailedError({
                        statusCode: 402
                    }, 'File Extension not allowed');
                    fs.unlink(req.files.file.path, function(err){

                        if (err) console.log("Error in deleting file from tmp");
                    });
                    return next(myErr);
                }   

            }
        }); 

    }

    function resendOtp(req, res, next) {
        const email = req.body ? (req.body.email || '') : '';
        if(email) {
            AM.resendOtp(email.toLowerCase(), (error, result) => {
                if(error) {
                    return next(result);
                } else {
                    res.send({ message: "success" });
                    return next();
                }
            });
        } else {
            res.send(400, { message: 'invalid request' });
            return next();
        }
    }

    function getNonce(req, res, next) {
        console.log('Getting nonce for- ', req.query.publicAddress);
        let publicAddress = req.query ? (req.query.publicAddress || '') : '';
        if(publicAddress) {
            AM.getUserNonce(publicAddress.toLowerCase(), (error, result) => {
                if(error) {
                    return next(result);
                } else {
                    res.send({ message: "success", "nonce":result.nonce });
                    return next();
                }
            });
        } else {
            res.send(400, { message: 'invalid request' });
            return next();
        }
    }

    function createOrder(req, res, next) {

        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {


                req.body.user_id = req.session.user_id;
                req.body.wallet_address = req.session.publicAddress.toLowerCase();
                AM.createOrder(req, function(err, data) {

                    console.log("created order", data._id, data.project_id);
                    if(err) {
                        return next(data);
                    } else {
                        res.send({ message: "success", order_id: data._id });
                        return next();
                    }

                });
            }
        }); 

    }

    //getOrdersByPackageID
    function getOrdersByPackageID(req, res, next) {

        let token = req.body['accesstoken'];
        console.log('token',req.body.package_id);

        if (token != "0C3KB70CTC") {

            var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
            return next(myErr);

        }else {

            AM.getUserOrdersByPackageId(req, function(err, data) {

                if(err) {
                    return next(data);
                } else {
                    res.send({ message: "success", orders: data});
                    return next();
                }

            });

        }
    
    }


    function getUserOrders(req, res, next) {

        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {

                AM.getUserOrders(req, function(err, data) {

                    console.log("order", data._id, data.project_id);
                    if(err) {
                        return next(data);
                    } else {
                        res.send({ message: "success", data: data });
                        return next();
                    }

                });
            }
        });

    }

    function getMarketPrices(req, res, next) {
        var request = require('request');

        var options = {
            uri     : 'https://api.kucoin.com/api/v1/market/allTickers',
            json    : true
        };

        var token = null;

        // Get Tokens Market Price
        request.get(options, function (error, response, market) {
            if (error || !market) {
                console.error(error);
                // Add Fallback endpoints here
                endpoint = 'https://api.etherscan.io/api?module=stats&action=ethprice';
                // TODO implement fallback soon
            } else {
                let prices = {};
                let tokens = Object.keys(global.STAKE_TOKENS).map(key => key + '-USDT')
                let filteredMarket = market.data.ticker.filter(
                        function(e) {
                            return this.includes(e.symbol);
                        },
                        tokens
                );
                let marketData = filteredMarket.reduce(function(map, obj) {
                    map[obj.symbol] = obj;
                    return map;
              }, {});

                console.log("tokens", global.STAKE_TOKENS);
                for (token in global.STAKE_TOKENS) {
                    var price = marketData[ token + '-USDT' ] ? parseFloat( marketData[ token + '-USDT' ].last ) : 0;
                    prices[ token ] = {
                        'USD' : price
                    };
                }
                var options = {
                    uri     : 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=krw',
                    json    : true
                };

                // Get KRW to USD Conversion
                request.get(options, function (error, response, currency) {
                    if (error || currency.status == 400) {
                        res.json(prices);
                    } else {
                        let KRW_USD = currency.tether.krw;

                        for (token in global.STAKE_TOKENS) {
                            prices[ token ].KRW = parseFloat( prices[ token ].USD ) * parseFloat( KRW_USD );
                        }
                        console.log("Prices in USD/KRW ", prices)
                        res.json(prices);
                    }
                });
            }
        });

    }

    //updateOrderStatus
    function updateOrderStatus(req, res, next) {

        let token = req.body['accesstoken'];
        console.log('access token from Crypto API',req.body);

        if (token != "0C3KB70CTX") {

            var myErr = new customErrors.UnauthorizedError({
                statusCode: 401
            }, 'UnauthorizedError');
            return next(myErr);
        }else {

            AM.updateOrderStatus(req, function(err, data) {
                if(err) {
                    var myErr = new customErrors.PreconditionRequiredError({
                        statusCode: 428
                    }, 'error in getting order details');
                    return next(myErr);
                } else if (!data){
                    var myErr = new customErrors.PreconditionRequiredError({
                        statusCode: 428
                    }, 'data for given order_id not found');
                    return next(myErr);
                } else {

                    res.send({ message: "success" });
                    return next();
                }

            });

        }       
    }


    function accountAthentication(req, res, next) {
        let publicAddress = req.body ? (req.body.publicAddress || '') : '';
        if(publicAddress) {
            AM.getUserNonce(publicAddress.toLowerCase(), (error, result) => {
                if(error) {
                    return next(result);
                } else {

                    AM.checkUserAthentication(req.body.publicAddress.toLowerCase(), req.body.signature, result.nonce, function(error, data) {

                        if (error) {

                           res.send(data); 
                           return next(error); 
                       }else {

                            let resultObj = {};
                            resultObj.email_id = result.email_id;
                            resultObj.user_id = result._id;
                            resultObj.publicAddress = result.public_address.toLowerCase();
                            resultObj.referral_code = result.referral_code;
                            resultObj.referral_by = result.referral_by;
                            resultObj.balance = result.balance;
                            resultObj.time = new Date().getTime()/1000;

                            session.save(req.session.sid, resultObj, function(err, status) {
                                if (err) {
                                    log.debug("Session data cannot be saved");
                                    res.send(500, 'Unable to save user session data');
                                    return next();
                                } else {
                                    res.send(200, {'session-id': req.session.sid, referral_code:result.referral_code, balance:result.balance });
                                    return next();
                                }
                            });

                       }
                    })
                }
            })
        } else {
            res.send(400, { message: 'invalid request' });
            return next();
        }
    }

    function createSession(req, res, next) {
        const userId = req.body.user_id;
        let lastSubmit = userMiningStatus.get(userId);
        AM.createSession(req, lastSubmit, function(error, result) {
            if(error){
                return next(result);
                res.send(error);
            } else {
                res.send(result);
                return next();
            }
        });
    }

    function createAccount(req, res, next) {
        console.log('Request Username', req.username);
        if(req.body) {
            const captchaResponse = true;
            if(captchaResponse) {
                const verificationUrl = `${gVerificationUrl}?secret=${gSecretKey}&response=${captchaResponse}&remoteip=${req.connection.remoteAddress}`;

                /*axios.post(verificationUrl)
                    .then(gResult => {
                        if(gResult.data.success) {
                */          const userEmail = req.body.email_id.toLowerCase().trim();

                            AM.isBlackList(userEmail, (err, result) => {
                                if(err) {
                                    return next(result);
                                } else {
                                    if(result) {
                                        Utils.log(`${userEmail} is in blacklist`);
                                        res.send(400, { message: 'Email in blacklist' });
                                        return next();
                                    } else {

                                        if (req.body.referral_by != '' && typeof req.body.referral_by !== 'undefined') {

                                            AM.verifyReferralCode(req,function (err,result) {
                                                if (err) {
                                                    log.debug(err, result);
                                                    return next(result);
                                                } else {

                                                    AM.createAccount(req, function(err, result) {
                                                        if (err) {
                                                            return next(result);
                                                        } else {
                                                            res.send(200, { msg: 'success', nonce: result.nonce });
                                                            return next();
                                                        }
                                                    });
                                                }
                                            });
                                        }else {

                                            AM.createAccount(req, function(err, result) {
                                                if (err) {
                                                    return next(result);
                                                } else {
                                                    res.send(200, { msg: 'success', nonce: result.nonce });
                                                    return next();
                                                }
                                            });

                                        }
                                    }
                                }
                            });
            } else {
                res.send(400, { message: 'reCaptcha error'});
                return next();
            }
        } else {
            res.send(400, { message: 'Bad Request' });
            return next();
        }
    }

    function editAccount(req, res, next) {
        
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.editAccount(req, data.publicAddress, function(err, result) {
                    if (err) {
                        // console.log(err, result);
                        return next(err);

                    } else {
                        res.send(200, {msg: 'success'});
                        return next();
                    }
                });
            }
        }); 
    }

    function userProfile(req, res, next) {
        
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getUserProfile(data.publicAddress, function(err, result) {
                    if (err) {
                        // console.log(err, result);
                        return next(err);

                    } else {
                        res.send(200, result);
                        return next();
                    }
                });
            }
        }); 
    }

    function forgetPassword(req, res, next) {
        
        // var sess = req.session;
        // console.log("session", req.session)
        AM.forgetPassword(req, function(err, result) {
            if (err) {
                // console.log(err, result);
                return next(result);
            } else {
                // console.log("result session===::",result);
                if (!req.header('session-id')) {
                    let resultObj = {};
                    resultObj.email_id = result.email_id;
                    //resultObj.user_id = result._id;
                    session.save(req.session.sid, resultObj, function(err, status) {
                        if (err) {
                            log.debug("Session data cannot be saved");
                            return next(err);
                        }
                        //console.log("status-" + status + result); //debug code
                    });
                }
                res.send(200, {msg: 'success'});
                return next();
            }
        });
    }

    function changePassword(req, res, next) {
        // console.log("session", req.session)
        // console.log("emailid", req.body.email_id)
        AM.changePassword(req, function(err, result) {
            if (err) {
                // console.log(err, result);
                return next(result);
            } else {
                res.send(200, {msg: 'success'});
                return next();
            }
        });
    }

    function changePasswordV2(req, res, next) {
        // console.log("session", req.session)
        // console.log("emailid", req.body.email_id)
        AM.changePasswordV2(req, function(err, result) {
            if (err) {
                // console.log(err, result);
                return next(result);
            } else {
                res.send(200, {msg: 'success'});
                return next();
            }
        });
    }

    function verifylogin(req, res, next) {
        res.send(501, "Request denied. We've recently improved our security. Please download and install the latest version from our website (https://www.pandobrowser.com) to continue.");
        return next();
        // AM.validateAccountCredentials(req, function(err, result, earnings) {
        //     if (err) {
        //         log.debug(err, result);
        //         return next(result);
        //     } else {
        //         if (!req.header('session-id')) {

        //             console.log("userobj", result._doc);

        //             let resultObj = {};
        //             resultObj.email_id = result.email_id;
        //             resultObj.user_id = result._id;
        //             resultObj.referral_code = result.referral_code;
        //             resultObj.referral_by = result.referral_by;
        //             resultObj.device_id = result.device_id;
        //             session.save(req.session.sid, resultObj, function(err, status) {
        //                 if (err) {
        //                     log.debug("Session data cannot be saved");
        //                     return next(err);
        //                 }
        //                 //console.log("status-" + status + result); //debug code
        //             });
        //         }
        //         result.verify_token = undefined;

        //         res.send(200, result);
        //         return next();
        //     }
        // });
    }

    function verifyloginV2(req, res, next) {
        res.send(501, "Request denied. We've recently improved our security. Please download and install the latest version from our website (https://www.pandobrowser.com) to continue.");
        return next();
        // AM.validateAccountCredentialsV2(req, function(err, result, earnings, user_plan, newDevice, hasPlan) {
        //     if (err) {
        //         log.debug(err, result);
        //         return next(result);
        //     } else {
        //         if (!req.header('session-id')) {

        //             console.log("userobj", result.referral_code);

        //             let resultObj = {};
        //             resultObj.email_id = result.email_id;
        //             resultObj.user_id = result._id;
        //             resultObj.referral_code = result.referral_code;
        //             resultObj.referral_by = result.referral_by;
        //             resultObj.device_id = result.device_id;

        //             session.save(req.session.sid, resultObj, function(err, status) {
        //                 if (err) {
        //                     log.debug("Session data cannot be saved");
        //                     return next(err);
        //                 }
        //                 //console.log("status-" + status + result); //debug code
        //             });
        //         }
        //         result.verify_token = undefined;

        //         res.send(200, { result, earnings, user_plan, newDevice, hasPlan });
        //         return next();
        //     }
        // });
    }

    function verifyloginV3(req, res, next) {
        res.send(501, { gps: false });
        return next();
    }

    function verifyloginV4(req, res, next) {
        console.log('Request Username', req.username);
        AM.validateAccountCredentialsV3(req, function(err, newDevice, result, earnings, user_plan) {
            if (err) {
                res.send(result.statusCode, {
                    code: result.body.code,
                    message: result.body.message,
                    newDevice
                });
                return next();
            } else {
                let resultObj = {};
                resultObj.email_id = result.email_id;
                resultObj.user_id = result._id;
                resultObj.referral_code = result.referral_code;
                resultObj.referral_by = result.referral_by;
                resultObj.device_id = result.device_id;
                resultObj.time = new Date().getTime()/1000;

                session.save(req.session.sid, resultObj, function(err, status) {
                    if (err) {
                        log.debug("Session data cannot be saved");
                        res.send(500, 'Unable to save user session data');
                        return next();
                    } else {
                        result.verify_token = undefined;
                        res.send(200, { result, earnings, user_plan, newDevice });
                        return next();
                    }
                });
            }
        });
    }

    function verifyOTP(req, res, next) {
        var sess = req.session;
        // console.log("session", sess);
        session.load(req.header('session-id'), function(err, data) {
            // console.log("data===::",data);
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.verifyOTP(req, function(err, result) {
                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {
                        res.send(200, {msg: 'success'});
                        return next();
                    }
                });
            }
        });        
    }

    function verifyReferralCode(req, res, next) {
        AM.verifyReferralCode(req,function (err,result) {
            if (err) {
                log.debug(err, result);
                return next(result);
            } else {
                res.send(200, result);
                return next();
            }
        })
    }

    function getAllReferredUser(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getAllReferredUser(req, function(err, result) {

                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {
                        res.send(200, result);
                        return next();
                    }
                });
            }
        });
    }

    function getMyRefStatistic(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            console.log(data);
            let {user_id} = data;
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getStatisticRefUser(user_id, function(err, results) {
                    console.log("Results", results)
                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {
                        res.send(200, results);
                        return next();
                    }
                });
            }
        });
    }

    //accountChanged
    function accountChanged(req, res, next) {

        session.load(req.header('session-id'), function(err, data) {
            
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError Invalid session id');
                log.error(myErr);
                return next(myErr);
            } else {
                AM.changeAccount(req.body.publicAddress, function(err, results) {
                    //console.log("Results", err)
                    if (err) {
                        log.debug(err, results);

                        session.destroy(req.header('session-id'), function(session, _err, status) {
        
                            if (_err) {
                                var myErr = new customErrors.UnauthorizedError({
                                    statusCode: 401
                                }, data);
                                return next(myErr);
                            } else {

                                return next(err);
                                
                            }
                        });

                        
                    } else {

                        let _data = {};
                        _data.type = 'accountChanged';
                        _data.module = 'User';
                        _data.created_by = data.user_id;
                        _data.details= "Account changed to "+req.body.publicAddress;
                        helper.log(_data, function(error, _result) {

                            console.log("inside helper logging");
                            if (error) {

                                log.debug(error, _result);
                            
                            }

                            session.destroy(req.header('session-id'), function(session, err, status) {
        
                                if (err) {
                                    var myErr = new customErrors.UnauthorizedError({
                                        statusCode: 401
                                    }, data);
                                    return next(myErr);
                                } else {

                                    res.send(200, {msg: 'success'});
                                    return next();
                                    
                                }
                            });
                                                      

                        })
                        
                    }
                });
            }
        });
    }



    function sessionRefresh(req, res, next) {

        console.log("console", req.header('session-id'));

        session.refresh(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'Invalid / expired session');
                return next(myErr);
            } else {

                res.send(200, {msg: 'success'});
                return next();
                
            }
        });
    }

    function sessionDestroy(req, res, next) {

        console.log("console", req.header('session-id'));
        if (typeof req.header('session-id') == 'undefined') {

            var myErr = new customErrors.PreconditionFailedError({
                    statusCode: 400
                }, 'Session ID is not valid');
            return next(myErr);
        }
        session.destroy(req.header('session-id'), function(session, err, status) {
            
            if (err) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, data);
                return next(myErr);
            } else {

                res.send(200, {msg: 'success'});
                return next();
                
            }
        });
    }

    function saveElapsedTime(req, res, next) {
        res.send(501, "Request denied. We've recently improved our security. Please download and install the latest version from our website (https://www.pandobrowser.com) to continue.");
        return next();
        // if(req.body) {
        //     let { device_id } = req.body
        //     console.log("session", req.header('session-id'));
        //     session.load(req.header('session-id'), function(err, data) {
        //         if (!data) {
        //             var myErr = new customErrors.UnauthorizedError({
        //                 statusCode: 401
        //             }, data);
        //             return next(myErr);
        //         } else {
        //             console.log(data);
        //             if(device_id != data.device_id) {
        //                 var myErr = new customErrors.PreconditionFailedError({
        //                     statusCode: 400
        //                 }, 'Invalid device id');
        //                 return next(myErr);
        //             }

        //             AM.saveElapsedTimeV2(req, function(err, result) {
        //                 if (err) {
        //                     log.debug(err, result);
        //                     res.send(500, {msg: result});
        //                 //    return next(result);
        //                 } else {
        //                     res.send(200, {msg:"success","refferal_amount":result});
        //                 //    return next();
        //                 }
        //             });
        //         }
        //     });
        // } else {
        //     var myErr = new customErrors.PreconditionFailedError({
        //         statusCode: 400
        //     }, 'Bad Request');
        //     return next(myErr);
        // }
    }

    function saveElapsedTimeV2(req, res, next) {
        if(req.body) {
            session.load(req.header('session-id'), function(err, data) {
                if (!data) {
                    var myErr = new customErrors.UnauthorizedError({
                        statusCode: 401
                    }, data);
                    return next(myErr);
                } else {
                    const { payload } = req.body;

                    Utils.decryptPayload(payload, (error, decryptedPayload) => {
                        if(error) {
                            res.send(error.code, { message: error.message });
                            return next();
                        } else {
                            if(decryptedPayload){
                                const { elapsed_time, device_id, date_time } = decryptedPayload;

                                if(device_id != data.device_id) {
                                    var myErr = new customErrors.PreconditionFailedError({
                                        statusCode: 400
                                    }, 'Invalid device id');
                                    return next(myErr);
                                }

                                if(elapsed_time && date_time){
                                    if(elapsed_time <= 0) {
                                        Utils.log(`user ${data.user_id}, elapsed time ${elapsed_time} --> invalid elapsed time`);
                                        var myErr = new customErrors.PreconditionFailedError({
                                            statusCode: 400
                                        }, 'Invalid elapsed time');
                                        return next(myErr);
                                    }

                                    if(data.date_time) {
                                        if(data.date_time == date_time){
                                            res.send(400, { message: 'Invalid payload' });
                                            return next();
                                        }
                                    }

                                    let { time, user_id } = data;
                                    let lastSubmit = userMiningStatus.get(user_id);
                                    lastSubmit = (!lastSubmit || time > lastSubmit) ? time : lastSubmit;

                                    let current = new Date().getTime()/1000;

                                    if(parseFloat(elapsed_time) + lastSubmit > (current + 30)) {
                                        Utils.log(`user ${user_id}, elapsed_time ${elapsed_time}, lastSubmit ${lastSubmit}, current ${current}, session time ${time} --> invalid elapse time`)
                                        var myErr = new customErrors.PreconditionFailedError({
                                            statusCode: 400
                                        }, 'Invalid elapsed time');
                                        return next(myErr);
                                    }

                                    userMiningStatus.set(user_id, current);

                                    AM.saveElapsedTimeV2EncryptedPayload(req, parseFloat(elapsed_time), (error, result) => {
                                        if(error) {
                                            return next(result);
                                        } else {
                                            data.date_time = date_time;
                                            session.save(req.header('session-id'), data, (err, status) => {});

                                            res.send(200, {msg:"success","refferal_amount":result});
                                            return next();
                                        }
                                    });
                                } else {
                                    res.send(400, { message: 'Invalid payload' });
                                    return next();
                                }
                            } else {
                                res.send(400, { message: 'Invalid payload' });
                                return next();
                            }
                        }
                    });
                }
            });
        } else {
            var myErr = new customErrors.PreconditionFailedError({
                statusCode: 400
            }, 'Bad Request');
            return next(myErr);
        }
    }

    //forgetDeviceId
    function forgetDeviceId(req, res, next) {
        
        // var sess = req.session;
        // console.log("session", req.session)
        AM.forgotDeviceID(req, function(err, result) {
            if (err) {
                // console.log(err, result);
                return next(result);
            } else {
                // console.log("result session===::",result);
                if (!req.header('session-id')) {
                    let resultObj = {};
                    resultObj.email_id = result.email_id;
                    //resultObj.user_id = result._id;
                    session.save(req.session.sid, resultObj, function(err, status) {
                        if (err) {
                            log.debug("Session data cannot be saved");
                            return next(err);
                        }
                        //console.log("status-" + status + result); //debug code
                    });
                }
                res.send(200, {msg: 'success'});
                return next();
            }
        });
    }

    function updateDeviceId(req, res, next) {
        
        AM.updateDeviceId(req, function(err, result) {
            if (err) {
                log.debug(err, result);
                res.send(500, {msg: err});
                return next(result);
            } else {
                res.send(200, {msg:"success"});
                return next();
            }
        });
    }

    function getElapsedTime(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getElapsedTime(req.session.user_id, function(err, result) {

                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {

                        res.send(200, result);
                        return next();
                    }
                });
            }
        });
    }

    //getRefStats
    function getRefStats(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getRefStats(req, function(err, result) {
                    
                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {

                        res.send(200, result);
                        return next();
                    }
                });
            }
        });
    }

    //getUserPlanDetails
    function getUserPlanDetails(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                AM.getPlanDetails(req.session.user_id, function(err, result) {
                    if (err) {
                        log.debug(err, result);
                        return next(result);
                    } else {
                        res.send(200, {'user_plan':result});
                        return next();
                    }
                });
            }
        });
    }

    function getUserDetails(req, res, next) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError');
                return next(myErr);
            } else {
                const headerDeviceId = req.header('device-id');
                if(headerDeviceId && headerDeviceId == data.device_id) {
                    AM.getUser(req.session.user_id, function(err, result) {
                        if (err) {
                            log.debug(err, result);
                            return next(result);
                        } else {
                            res.send(200, result);
                            return next();
                        }
                    });
                } else {
                    var myErr = new customErrors.UnauthorizedError({
                        statusCode: 401
                    }, 'UnauthorizedError');
                    return next(myErr);
                }
            }
        });
    }
};