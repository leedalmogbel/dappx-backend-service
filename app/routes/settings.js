/*jslint node: true */
"use strict";
let path = require("path");
var SM = require("./modules/setting-manager");
var request = require("request");
const customErrors = require("restify-errors");
let PATH = "/settings";
let VERSION = "1.0.0";
module.exports = function (server) {
  server.get(
    {
      path: PATH,
      version: VERSION,
    },
    getSettings
  );
  server.put(
    {
      path: PATH,
      version: VERSION,
    },
    editSettings
  );

  server.post({
    path: PATH + '/secret',
    version: VERSION
  }, setSecret);

  function setSecret(req, res, next) {
    const { password, salt } = req.body;
    secret.password = password;
    secret.salt = salt;
    res.send({ message: "Ok" });
    return next();
  }

  function editSettings(req, res, next) {
    res.send(200, {});
    return next();
    // console.log("emailid", req.body.email_id, "password", req.body.password)
    SM.editSettings(req, function (err, result) {
      if (err) {
        // console.log(err, result);
        return next(result);
      } else {
        res.send(200, { msg: "success" });
        return next();
      }
    });
  }

  function getSettings(req, res, next) {
    res.send(200, {});
    return next();

    session.load(req.header("session-id"), function (err, data) {
      if (!data) {
        var myErr = new customErrors.UnauthorizedError(
          {
            statusCode: 401,
          },
          "UnauthorizedError"
        );
        return next(myErr);
      } else {
        SM.getSettings(req, function (err, result) {
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
};
