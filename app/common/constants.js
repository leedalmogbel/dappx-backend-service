const withdrawalStatus = {
	NEW: 0,
	PENDING: 1,
	SUCCEED: 2,
	FAIL: 3
}

const withdrawalSpeed = {
	SLOW: 1,
	AVERAGE: 2,
	FAST: 3
}

const wallet_fields = [
	'decenternet_hot_wallet_address',
	'pando_hot_wallet_address'
];

module.exports = {
	wallet_fields,
	withdrawalStatus,
	withdrawalSpeed
}