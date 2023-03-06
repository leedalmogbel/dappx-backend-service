const PATH = "/withdrawal";
const VERSION = "1.0.0";

const { withdrawalPreview, withdraw, withdrawalHistory, getWithdrawalSettings, hasPending, haveReachedLimit } = require('./modules/withdrawal-manager');
const Utils = require('../common/Utils');

module.exports = function(server) {
	server.post({
		path: PATH + '/validateAddress/:address',
		version: VERSION
	}, validateAddress);

	server.post({
		path: PATH + '/withdraw',
		version: VERSION
	}, _withdraw);

	server.post({
		path: '/updateWithdrawStatus',
		version: VERSION
	}, updateWithdrawStatus);

	server.post({
		path: PATH + '/withdrawalPreview',
		version: VERSION
	}, _withdrawalPreview);

	server.post({
		path: PATH + '/withdrawV2',
		version: VERSION
	}, _withdrawV2);

	server.post({
		path: PATH + '/withdrawV3',
		version: VERSION
	}, _withdrawV3);

	server.post({
		path: PATH + '/withdrawV4',
		version: VERSION
	}, withdrawThrottle, _withdrawV4);

	server.post({
		path: PATH + '/withdrawalPreviewV2',
		version: VERSION
	}, _withdrawalPreviewV2);

	server.post({
		path: PATH + '/withdrawalPreviewV3',
		version: VERSION
	}, _withdrawalPreviewV3);

	server.get({
		path: PATH + '/withdrawalHistory',
		version: VERSION
	}, getWithdrawalHistory);

	server.get({
		path: PATH + '/checkWithdrawStatus',
		version: VERSION
	}, getWithdrawStatus);

	server.get({
		path: PATH + '/checkWithdrawStatusV2',
		version: VERSION
	}, getWithdrawStatusV2);

	server.get({
		path: '/withdrawalSettings',
		version: VERSION
	}, _getWithdrawalSettings);

	function updateWithdrawStatus(req, res, next) {
		if(req.body) {
			const { payload } = req.body;

			if(payload) {
				if(secret.password && secret.salt) {
					try {
						const body = JSON.parse(Utils.decryptString(secret.password, secret.salt, payload));
						console.log('Update withdraw status', body);
						const { userId } = body;

						if(userId){
							withdrawRequestsStatus.set(userId, false);
							res.send(200, { message: 'success' });
							return next();
						} else {
							res.send(400, { message: 'Invalid Request' });
							return next();
						}
					} catch (error) {
						res.send(400, { message: 'Key-pair mismatch' });
						return next();
					}
				} else {
					res.send(400, { message: 'Missing key-pair' });
					return next();
				}
			} else {
				res.send(400, { message: 'Invalid Request' });
				return next();
			}
		} else {
			res.send(400, { message: 'Invalid Request' });
			return next();
		}
	}

	function getWithdrawStatus(req, res, next) {
		res.send(501, { gps: false });
		return next();
	}

	function getWithdrawStatusV2(req, res, next) {
		session.load(req.header("session-id"), function(err, data) {
			if(data) {
				const user_id = data.user_id;
				if(user_id) {
					hasPending(user_id, (error, result) => {
						if(error) {
							res.send(error.code, { message: error.message });
							return next();
						} else {
							session.load(user_id, function(err, userData) {
								if(err) {
									log.error(err);
								}

								const userWithdrawStatus = userData ? userData.withdraw_status : false;

								const hasPending = result || userWithdrawStatus;
								if(hasPending) {
									res.send({ hasPending });
									return next();
								} else {
									haveReachedLimit(user_id, (error, limitStatus) => {
										if(error) {
											res.send(error.code, { message: error.message });
											return next();
										} else {
											res.send({
												hasPending,
												limitStatus
											});
											return next();
										}
									});
								}
							});
						}
					});
				} else {
					res.send(401, { message: "Unauthorized Access" });
					return next();
				}
			} else {
				res.send(401, { message: "Unauthorized Access" });
				return next();
			}
		});
	}

	function _getWithdrawalSettings(req, res, next) {
		getWithdrawalSettings((error, result) => {
			if(error) {
				res.send(error.code, { message: error.message });
				return next();
			} else {
				res.send(result);
				return next();
			}
		});
	}

	function validateAddress(req, res, next) {
		const { address } = req.params;
		if(address) {
			res.send({ valid: Utils.isValidAddress(address) });
			return next();
		} else {
			res.send(400, { message: 'No address provided' });
			return next();
		}
	}

	function _withdrawalPreview(req, res, next) {
		res.send(501, "Request denied. We've recently improved our security. Please download and install the latest version from our website (https://www.pandobrowser.com) to continue.");
        return next();
	}

	function _withdraw(req, res, next) {
		res.send(501, "Request denied. We've recently improved our security. Please download and install the latest version from our website (https://www.pandobrowser.com) to continue.");
        return next();
	}

	function _withdrawalPreviewV2(req, res, next) {
		res.send(501, { gps: false });
		return next();
	}

	function _withdrawalPreviewV3(req, res, next) {
		session.load(req.header("session-id"), function(err, data) {
			if(data) {
				const user_id = data.user_id;
				if(user_id) {
					haveReachedLimit(user_id, (error, limitStatus) => {
						if(error) {
							res.send(error.code, { message: error.message });
							return next();
						} else {
							if(limitStatus.haveReachedAmountLimit || limitStatus.haveReachedCountLimit) {
								res.send(400, { message: "Reached limit", limitStatus });
								return next();
							} else {
								withdrawalPreview(user_id, req, (error, result) => {
									if(error) {
										res.send(error.code, { message: error.message });
										return next();
									} else {
										res.send(result);
										return next();
									}
								});
							}
						}
					});
				} else {
					res.send(401, { message: "Unauthorized Access" });
					return next();
				}
			} else {
				res.send(401, { message: "Unauthorized Access" });
				return next();
			}
		});
	}

	function _withdrawV2(req, res, next) {
		res.send(501, { gps: false });
		return next();
	}

	function updateWithdrawStatusFlagOnRedis(userId, flag, callback) {
		session.save(userId, { withdraw_status: flag }, (error, status) => {
			if(error) {
				log.error(error);
			}
			callback(null, true);
		});
	}

	function _withdrawV3(req, res, next) {
		res.send(501, { gps: false });
		return next();
	}

	function _withdrawV4(req, res, next) {
		console.log('Request Username', req.username);

		const headerDeviceId = req.header('device-id');

		if(headerDeviceId) {
			session.load(req.header("session-id"), function(err, data) {
				if(data) {
					if(headerDeviceId == data.device_id) {
						const user_id = data.user_id;
						if(user_id) {
							session.load(user_id, function(err, userData) {
								if(err) {
									log.error(err);
								}
								
								const userWithdrawStatus = userData ? userData.withdraw_status : false;

								if(userWithdrawStatus == true) {
									res.send(400, { message: 'User has pending withdrawals' });
									return next();
								} else {
									updateWithdrawStatusFlagOnRedis(user_id, true, (error, status) => {
										haveReachedLimit(user_id, (error, limitStatus) => {
											if(error) {
												updateWithdrawStatusFlagOnRedis(user_id, false, (error, status) => {});

												res.send(error.code, { message: error.message });
												return next();
											} else {
												if(limitStatus.haveReachedAmountLimit || limitStatus.haveReachedCountLimit) {
													updateWithdrawStatusFlagOnRedis(user_id, false, (error, status) => {});

													res.send(400, { message: "Reached limit", limitStatus });
													return next();
												} else {
													const emailId = data.email_id || '';
													const deviceId = req.header('device-id') || '';
													const total_amount = req.body ? (req.body.total_amount || 0) : 0;
													const ipAddress = req.header('X-Forwarded-For') || '';
													console.log(`Withdraw Request: ${emailId} - ${new Date()} - ${total_amount} - ${deviceId} - ${ipAddress}`);

													withdraw(user_id, req, (error, result) => {
														if(error) {
															updateWithdrawStatusFlagOnRedis(user_id, false, (error, status) => {});

															res.send(error.code, { message: error.message });
															return next();
														} else {
															if(result.valid == false) {
																updateWithdrawStatusFlagOnRedis(user_id, false, (error, status) => {});
															}

															res.send(result);
															return next();
														}
													});
												}
											}
										});
									});
								}
							});
						} else {
							res.send(401, { message: "Unauthorized Access" });
							return next();
						}
					} else {
						res.send(401, { message: "Unauthorized Access" });
						return next();
					}
				} else {
					res.send(401, { message: "Unauthorized Access" });
					return next();
				}
			});
		} else {
			res.send(401, { message: "Unauthorized Access" });
			return next();
		}
	}

	function getWithdrawalHistory(req, res, next) {
		session.load(req.header("session-id"), function(err, data) {
			if(data) {
				const user_id = data.user_id;
				if(user_id) {
					withdrawalHistory(user_id, (error, result) => {
						if(error) {
							res.send(error.code, { message: error.message });
							return next();
						} else {
							res.send(result);
							return next();
						}
					});
				} else {
					res.send(401, { message: "Unauthorized Access" });
					return next();
				}
			} else {
				res.send(401, { message: "Unauthorized Access" });
				return next();
			}
		});
	}

}