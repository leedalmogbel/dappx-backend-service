const customErrors = require("restify-errors");
let mongoose = require("mongoose");
let Settings = mongoose.model("Settings");

exports.editSettings = function (req, callback) {
  let { commission_rate, max_reward, referral_rate } = req.body;

  let _settingsModel = {};
  if (commission_rate != undefined) {
    _settingsModel.commission_rate = commission_rate;
  }
  if (max_reward != undefined) {
    _settingsModel.max_reward = max_reward;
  }
  if (referral_rate != undefined) {
    _settingsModel.referral_rate = referral_rate;
  }

  Settings.updateOne({}, _settingsModel, function (
    error,
    settingsData,
    numAffected
  ) {
    callback(error, settingsData);
    return;
  });
};

exports.getSettings = function (req, callback) {
  Settings.findOne({}, {}, function (err, resultsSettings) {
    // console.log("results", results._id)
    if (resultsSettings) {
      callback(err, resultsSettings);
      return;
    } else {
      var myErr = new customErrors.PreconditionFailedError(
        {
          statusCode: 402,
        },
        "no settings found"
      );
      callback(true, myErr);
      return;
    }
  });
};
