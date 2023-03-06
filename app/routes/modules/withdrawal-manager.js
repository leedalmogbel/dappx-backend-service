const mongoose = require('mongoose');
const Withdrawal = mongoose.model('Withdrawal');
const Settings = mongoose.model('Settings');
const TransactionFee = mongoose.model('TransactionFee');
const Users = mongoose.model('Users');

const AM = require('./account-manager');
const { withdrawalStatus } = require('../../common/constants');
const Utils = require('../../common/Utils');
const config = require("../../../config/config");

const axios = require('axios');

const withdrawalPreview = (user_id, req, callback) => {
	let {
		total_amount,
		receiver_address
	} = req.body;

	try {
		total_amount = parseFloat(total_amount);
	} catch(e) {
		callback({
			code: 400,
			message: 'Invalid amount'
		}, null);
		return;
	}

	if(secret.password && secret.salt){
		if(total_amount && receiver_address){
			// validate address
			if(Utils.isValidAddress(receiver_address)){
				Settings.findOne({}, (error, settings) => {
					if(error) {
						console.log(error);
						callback({
							code: 500,
							message: 'Error while fetching withdrawal settings'
						}, null);
					} else {
						if(settings.enable_withdraw) {
							if(settings 
								&& settings.min_withdrawal_amount
								&& settings.max_withdrawal_amount
								&& settings.withdrawal_speed
								&& settings.daily_withdraw_limit_amount) {

								getDateTimeRange((dateRange) => {
									getTotalAmountWithdrawn24hrs(user_id, dateRange, (error, totalWithdrawnAmount) => {
										if(error) {
											callback(error, null);
										} else {
											let remainingAmount = settings.daily_withdraw_limit_amount - totalWithdrawnAmount;
											remainingAmount = parseFloat((remainingAmount).toFixed(8));

											if(total_amount > remainingAmount) {
												callback({
													code: 400,
													message: 'Amount exceeds daily withdrawal limit'
												}, null);
											} else {
												if(total_amount < settings.min_withdrawal_amount){
													callback({
														code: 400,
														message: 'Total amount is less than the allowed minimum withdrawal amount'
													}, null);
												} else if(total_amount > settings.max_withdrawal_amount) {
													callback({
														code: 400,
														message: 'Total amount is greater than the allowed maximum withdrawal amount'
													}, null);
												} else {
													hasPending(user_id, (error, userHasPending) => {
														if(error) {
															callback(error, null);
														} else {
															if(userHasPending) {
																callback({
																	code: 400,
																	message: 'User has pending withdrawals'
																}, null);
															} else {
																getTransactionBracketByAmount(total_amount, (error, bracket) => {
																	if(error) {
																		callback(error, null);
																	} else {
																		if(bracket) {
																			const transaction_fee_amount = bracket.fee;
																			const amount_sent = parseFloat((total_amount - transaction_fee_amount).toFixed(8));

																			if(amount_sent <= 0) {
																				callback({
																					code: 400,
																					message: '0 or negative computed amount to be received'
																				}, null);
																			} else {
																				// validate total_amount here
																				AM.getElapsedTime(user_id, (error, earnings) => {
																					if(error) {
																						callback({
																							code: 400,
																							message: 'Error while validating withdraw amount'
																						}, null);
																					} else {
																						let withdrawableBalance = 0;
																						withdrawableBalance = (earnings.elapsed_pando_earned
																							+ earnings.passive_mining_elapsed_pando_earned
																							+ earnings.referral_pando_earned) - (earnings.withdrawn_succeed + earnings.withdrawn_pending + earnings.withdrawn_new);

																						if(total_amount <= withdrawableBalance) {
																							callback(null, {
																								total_amount,
																								transaction_fee_amount,
																								amount_sent,
																								receiver_address
																							});
																						} else {
																							callback({
																								code: 400,
																								message: 'Amount exceeds the withdrawable balance of the user'
																							}, null);
																						}
																					}
																				});
																			}
																		} else {
																			callback({
																				code: 400,
																				message: 'Transaction fee bracket for the amount is not configured yet, please contact administrator'
																			}, null);
																		}
																	}
																});
															}
														}
													});
												}
											}
										}
									});
								});
							} else {
								callback({
									code: 400,
									message: 'Withdrawal settings is not configured yet, please contact administrator'
								}, null);
							}
						} else {
							callback({
								code: 400,
								message: 'Pando Token Withdrawal is not available at this moment'
							}, null);
						}
					}
				});
			} else {
				callback({
					code: 400,
					message: 'Invalid destination address'
				}, null);
			}
		} else {
			callback({
				code: 400,
				message: 'Missing required fields in the request body'
			}, null);
		}
	} else {
		if(config.env == 'development'){
			axios.post(`${config.adminPanelApiUrl}/settings/generate-key-pair/1`)
				.then(result => {}).catch(error => {});
		} else if (config.env == 'production'){
			axios.post(`${config.adminPanelApiUrl}/settings/generate-key-pair/3`)
				.then(result => {}).catch(error => {});
		}

		callback({
			code: 400,
			message: 'Service currently unavailable, please try again in 10 seconds.'
		}, null);
	}
}

const withdraw = (user_id, req, callback) => {
	let {
		total_amount,
		receiver_address,
		transaction_fee
	} = req.body;

	try {
		total_amount = parseFloat(total_amount);
	} catch(e) {
		callback({
			code: 400,
			message: 'Invalid amount'
		}, null);
		return;
	}

	if(secret.password && secret.salt){
		if(total_amount && receiver_address && transaction_fee){
			if(Utils.isValidAddress(receiver_address)) {
				Settings.findOne({}, (error, settings) => {
					if(error) {
						console.log(error);
						callback({
							code: 500,
							message: 'Error while fetching withdrawal settings'
						}, null);
					} else {
						if(settings.enable_withdraw) {
							if(settings 
								&& settings.min_withdrawal_amount
								&& settings.max_withdrawal_amount
								&& settings.withdrawal_speed
								&& settings.daily_withdraw_limit_amount){

								getDateTimeRange((dateRange) => {
									getTotalAmountWithdrawn24hrs(user_id, dateRange, (error, totalWithdrawnAmount) => {
										if(error) {
											callback(error, null);
											return;
										}
										
										let remainingAmount = settings.daily_withdraw_limit_amount - totalWithdrawnAmount;
										remainingAmount = parseFloat((remainingAmount).toFixed(8));

										if(total_amount > remainingAmount) {
											callback({
												code: 400,
												message: 'Amount exceeds daily withdrawal limit'
											}, null);
											return;
										}

										if(total_amount < settings.min_withdrawal_amount){
											callback({
												code: 400,
												message: 'Total amount is less than the allowed minimum withdrawal amount'
											}, null);
											return;
										}

										if(total_amount > settings.max_withdrawal_amount) {
											callback({
												code: 400,
												message: 'Total amount is greater than the allowed maximum withdrawal amount'
											}, null);
											return;
										}

										getTransactionBracketByAmount(total_amount, (error, bracket) => {
											if(error) {
												callback(error, null);
												return;
											}

											if(bracket) {
												// check transaction fee amount if changed
												if(bracket.fee != transaction_fee) {
													const transaction_fee_amount = bracket.fee;
													const amount_sent = parseFloat((total_amount - transaction_fee_amount).toFixed(8));

													if(amount_sent <= 0) {
														callback({
															code: 400,
															message: '0 or negative computed amount to be received'
														}, null);
													} else {
														callback(null, {
															valid: false,
															details: {
																total_amount,
																transaction_fee_amount,
																amount_sent,
																receiver_address
															}
														});
													}
												} else {
													const transaction_fee_amount = bracket.fee;
													const amount_sent = parseFloat((total_amount - transaction_fee_amount).toFixed(8));
													const gas_speed = settings.withdrawal_speed;

													if(amount_sent <= 0) {
														callback({
															code: 400,
															message: '0 or negative computed amount to be received'
														}, null);
														return;
													}

													const status = withdrawalStatus.NEW;
													
													// save withdrawal info first, then call crypto, then update withdrawal info
													const withdrawal = new Withdrawal({
														user_id,
														total_amount,
														transaction_fee_amount,
														gas_speed,
														amount_sent,
														receiver_address,
														status,
														transaction_hash: '',
														pando_hot_wallet_address: ''
													});

													hasPending(user_id, (error, userHasPending) => {
														if(error) {
															callback(error, null);
															return;
														}

														if(userHasPending) {
															callback({
																code: 400,
																message: 'User has pending withdrawals'
															}, null);
															return;
														}

														// validate total_amount here
														AM.getElapsedTime(user_id, (error, earnings) => {
															if(error) {
																callback({
																	code: 400,
																	message: 'Error while validating withdraw amount'
																}, null);
																return;
															}

															let withdrawableBalance = 0;
															withdrawableBalance = (earnings.elapsed_pando_earned
																+ earnings.passive_mining_elapsed_pando_earned
																+ earnings.referral_pando_earned) - (earnings.withdrawn_succeed + earnings.withdrawn_pending + earnings.withdrawn_new);

															if(total_amount <= withdrawableBalance) {
																withdrawal.save((error, initialWithdrawInfo) => {
																	if(error) {
																		console.log(error);
																		callback({
																			code: 500,
																			message: 'Error while saving withdraw transaction information'
																		}, null);
																	} else {
																		// call crypto here
																		const cryptoBody = {
																			id: initialWithdrawInfo._id,
																			amount: amount_sent,
																			destination: receiver_address,
																			gas: gas_speed
																		}

																		const payload = Utils.encryptString(secret.password, secret.salt, JSON.stringify(cryptoBody)).hex;

																		axios.post(`${config.cryptoApiUrl}/withdraw`, { payload })
																			.then(cResult => {
																				if(cResult.data.code === 200) {
																					initialWithdrawInfo.queue_id = cResult.data.data.queueId;

																					Withdrawal.updateOne({ _id: initialWithdrawInfo._id },
																						{ $set: { queue_id: cResult.data.data.queueId } },
																						(error, updateResult) => {

																						callback(null, {
																							valid: true,
																							details: initialWithdrawInfo
																						});
																					});
																				} else {
																					deleteWithdrawTransaction(initialWithdrawInfo._id, (error, result) => {});
																					callback({
																						code: 400,
																						message: cResult.data.data.message
																					}, null);
																				}
																			})
																			.catch(error => {
																				deleteWithdrawTransaction(initialWithdrawInfo._id, (error, result) => {});
																				callback({
																					code: 500,
																					message: 'Error occurred on crypto API request'
																				}, null);
																			});
																	}
																});
															} else {
																callback({
																	code: 400,
																	message: 'Amount exceeds the withdrawable balance of the user'
																}, null);
															}
														});
													});
												}
											} else {
												callback({
													code: 400,
													message: 'Transaction fee bracket for the amount is not configured yet, please contact administrator'
												}, null);
											}
										});
									});
								});
							} else {
								callback({
									code: 400,
									message: 'Withdrawal settings is not configured yet, please contact administrator'
								}, null);
							}
						} else {
							callback({
								code: 400,
								message: 'Pando Token Withdrawal is not available at this moment'
							}, null);
						}
					}
				});
			} else {
				callback({
					code: 400,
					message: 'Invalid destination address'
				}, null);
			}
		} else {
			callback({
				code: 400,
				message: 'Missing required fields in the request body'
			}, null);
		}
	} else {
		if(config.env == 'development'){
			axios.post(`${config.adminPanelApiUrl}/settings/generate-key-pair/1`)
				.then(result => {}).catch(error => {});
		} else if (config.env == 'production'){
			axios.post(`${config.adminPanelApiUrl}/settings/generate-key-pair/3`)
				.then(result => {}).catch(error => {});
		}

		callback({
			code: 400,
			message: 'Service currently unavailable, please try again in 10 seconds.'
		}, null);
	}
}

const updateWithdrawalStatus = (user_id, callback) => {
	Withdrawal.find({ user_id, status: withdrawalStatus.PENDING }, (error, pendingWithdrawals) => {
		if(error){
			console.log(`Withdrawal Status Update ${user_id} - ${error}`);
			callback(false, true);
		} else {
			const updateStatus = pendingWithdrawals.map(withdrawal => {
				// call crypto api here to get status of transaction

				const newStatus = withdrawalStatus.PENDING;
				withdrawal.status = newStatus;
				withdrawal.save((error, result) => {});
			});

			Promise.all(updateStatus)
				.then(() => {
					callback(false, true);
				})
				.catch(error => {
					console.log(error);
				});
		}
	});
}

const withdrawalHistory = (user_id, callback) => {
	Withdrawal.find({ user_id })
		.sort({ createdAt: -1 })
		.exec((error, result) => {
			if(error) {
				console.log(error);
				callback({
					code: 500,
					message: 'Error fetching withdrawal history'
				}, null);
			} else {
				callback(null, result);
			}
		});
}

const getTransactionBracketByAmount = (amount, callback) => {
	TransactionFee.findOne({ range_lower: { $lte: amount }, range_upper: { $gte: amount } }, (error, result) => {
		if(error) {
			callback({
				code: 500,
				message: 'Error fetching transaction fee bracket with specified amount'
			}, null);	
		} else {
			callback(null, result);
		}
	});
}

const getWithdrawalSettings = (callback) => {
	Settings.findOne({}, (error, settings) => {
		if(error){
			callback({
				code: 500,
				message: 'Error fetching withdrawal settings'
			}, null);
		} else {
			callback(null, { 
				min: settings.min_withdrawal_amount || 0,
				max: settings.max_withdrawal_amount || 0,
				withdraw_enabled: settings.enable_withdraw,
				daily_withdraw_limit_amount: settings.daily_withdraw_limit_amount,
				daily_withdraw_limit_frequency: settings.daily_withdraw_limit_frequency,
				no_plan_users_enable_withdraw: settings.no_plan_users_enable_withdraw
			});
		}
	});
}

const deleteWithdrawTransaction = (withdrawId, callback) => {
	Withdrawal.deleteOne({ _id: withdrawId.toString() }, (error, result) => {
		if(error) {
			console.log(error);
		} else {
			console.log('Withdraw transaction deleted');
		}
	});
}

const withinBuffer = (user_id, checkOnly, callback) => {
	Users.findById(user_id, (error, user) => {
		if(error) {
			console.log(error);
		} else {
			if(user) {
				const buffer = 5 * 60 * 1000;
				if(user.last_withdraw) {
					const diff = (new Date()).getTime() - user.last_withdraw.getTime();
					if(diff > buffer) {
						callback(null, false);
					} else {
						callback(null, true);
					}
				} else {
					if(checkOnly){
						callback(null, true);
					} else {
						Users.updateOne({ _id: user_id }, { $set: { last_withdraw: new Date()}}, (error, result) => {
							callback(null, true);
						});
					}
				}
			} else {
				callback(null, false);
			}
		}
	});
}

const hasPending = (user_id, callback) => {
	Withdrawal.findOne({ 
		user_id, 
		$or: [{ status: withdrawalStatus.NEW }, { status: withdrawalStatus.PENDING }]},
		(error, withdrawTx) => {
			if(error) {
				callback({
					code: 400,
					message: 'Error checking if user has pending withdrawals'
				}, null);
			} else {
				if(withdrawTx){
					callback(null, true);
				} else {
					callback(null, false);
				}
			}
	});
}

const haveReachedLimit = (user_id, callback) => {
	getDateTimeRange((dateRange) => {
		Settings.findOne({}, (error, settings) => {
			if(error){
				callback({
					code: 500,
					message: 'Error fetching withdrawal settings'
				}, null);
			} else {
				Withdrawal.find({ user_id, createdAt: { "$gte": dateRange.startDateTime, "$lte": dateRange.endDateTime } },  (error, txs) => {
					if(error) {
						callback({
							code: 500,
							message: 'Error fetching user withdraw count'
						}, null);
					} else {
						const count = txs.length;
						getTotalAmountWithdrawn24hrs(user_id, dateRange, (error, totalWithdrawnAmount) => {
							if(error) {
								callback(error, null);
							} else {
					            let haveReachedCountLimit = false;
					            let haveReachedAmountLimit = false;
					            let remainingCount = 0;
					            let remainingAmount = 0;

					            if(count >= settings.daily_withdraw_limit_frequency) {
					            	haveReachedCountLimit = true;
					            } else {
					            	remainingCount = settings.daily_withdraw_limit_frequency - count;
					            }

					            if(totalWithdrawnAmount >= settings.daily_withdraw_limit_amount) {
					            	haveReachedAmountLimit = true;
					            } else {
					            	remainingAmount = settings.daily_withdraw_limit_amount - totalWithdrawnAmount;
					            	remainingAmount = parseFloat((remainingAmount).toFixed(8));
					            }

					            Utils.log(`${user_id} - (${dateRange.startDateTime.toISOString()} - ${dateRange.endDateTime.toISOString()}) - ${count} - ${totalWithdrawnAmount}`);

					            callback(null, { 
					            	haveReachedCountLimit,
					            	haveReachedAmountLimit,
					            	remainingCount,
					            	remainingAmount,
					            	daily_withdraw_limit_frequency: settings.daily_withdraw_limit_frequency,
					            	daily_withdraw_limit_amount: settings.daily_withdraw_limit_amount
					            });
					        }
					    });
					}
				});
			}
		});
	});
}

const getDateTimeRange = (callback) => {
	const currDate = new Date();
	const currHh = currDate.getHours();
	const hhThreshold = 15;
	let startDateTime = new Date(currDate);
	let endDateTime = new Date(currDate);

	if(currHh < hhThreshold) {
		startDateTime.setDate(startDateTime.getDate() - 1);
		startDateTime.setHours(15);
		startDateTime.setMinutes(0);
		startDateTime.setSeconds(0);
		startDateTime.setMilliseconds(0);

		endDateTime.setHours(14);
		endDateTime.setMinutes(59);
		endDateTime.setSeconds(59);
		endDateTime.setMilliseconds(999);
	} else {
		startDateTime.setHours(15);
		startDateTime.setMinutes(0);
		startDateTime.setSeconds(0);
		startDateTime.setMilliseconds(0);

		endDateTime.setDate(endDateTime.getDate() + 1);
		endDateTime.setHours(14);
		endDateTime.setMinutes(59);
		endDateTime.setSeconds(59);
		endDateTime.setMilliseconds(999);
	}

	callback({ startDateTime, endDateTime });
}

const getTotalAmountWithdrawn24hrs = (user_id, dateRange, callback) => {
	Withdrawal.aggregate([
	        { $match: { user_id: user_id, createdAt: { "$gte": dateRange.startDateTime, "$lte": dateRange.endDateTime } } },
	        { $group: { _id: null, total_amount: { $sum: "$total_amount" } } }
	    ], function(err, result){
	        if(err) {
	            callback({
					code: 500,
					message: 'Error fetching user total withdraw amount'
				}, null);
	        } else {
	            const totalWithdrawnAmount = result[0] ? result[0].total_amount : 0;
	            callback(null, totalWithdrawnAmount);
	        }
    });
}

module.exports = {
	withdrawalPreview,
	withdraw,
	withdrawalHistory,
	updateWithdrawalStatus,
	getWithdrawalSettings,
	hasPending,
	haveReachedLimit
}