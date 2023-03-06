/*jslint node: true */
'use strict';
let restify = require('restify');
var plugins = require('restify').plugins;
const corsMiddleware = require('restify-cors-middleware')
global.session = require('restify-session')({
    debug: true,
    ttl: 172800
});

let path = require('path');
let config = require(path.join(__dirname, '/config/config'));
global.log = require(path.join(__dirname, '/log'));
let models = require(path.join(__dirname, '/app/models/'));
let routes = require(path.join(__dirname, '/app/routes/'));
let dbConnection = require(path.join(__dirname, '/db-connection'));
const axios = require('axios');
const customErrors = require('restify-errors');
/*global.assetContractAddress = config.openSeaContract.contractAddress;
global.crypto_list = ["ETH", "KLAY", "TRX", "SPYCE", "DAI"];
global.CRYPTO_API_URL  = "http://localhost:5000";*/
global.REFERRAL_CODE_GENERATOR = require('referral-code-generator');
global.rateLimit = restify.plugins.throttle({ burst: 5, rate: 0.5, username: true });
global.rateLimitOneRequestPerSecond = restify.plugins.throttle({ burst: 5, rate: 1, username: true });
global.withdrawThrottle = restify.plugins.throttle({ burst: 1, rate: 0.066666667, username: true });
global.gSecretKey = '6LcYP-8ZAAAAAEcKgNcNIGQ_EaNFMEZ1YtIHgIRt';
global.gVerificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
global.OTP_VALIDITY = (5 * 60 * 1000); // 5 minutes
global.RESEND_BUFFER = (2 * 60 * 1000); // 2 minutes

global.secret = { password: '', salt: '' };
global.withdrawRequestsStatus = new Map();

dbConnection();

let server = restify.createServer({
    name: config.app.name,
    log: log
});
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.gzipResponse());
server.pre(restify.pre.sanitizePath());
server.use(restify.plugins.authorizationParser());
// attach the session manager
server.use(session.sessionManager)

server.opts(/.*/, function (req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);
    return next();
});

const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['*'],
  allowHeaders: ['session-id', 'device-id'],
  exposeHeaders: ['session-id-expiry','session-id']
})

global.STAKE_TOKENS = {
    "ACE": {
        "name": "Acent",
        "lockup": true,
        "staking": true,
        "limit": true
    },
    "DAPPX": {
        "name": "dAppstore",
        "lockup": true,
        "staking": true,
        "limit": true
    },
    "ETH": {
        "name": "Ethereum",
        "lockup": false,
        "staking": false,
        "limit": false
    }
};

server.pre(cors.preflight);
server.use(cors.actual);

// restify.CORS.ALLOW_HEADERS.push('session-id');
// server.pre(restify.CORS());
// server.use(restify.fullResponse());

// server.on('after', restify.plugins.auditLogger(
//   {
//     log: log
//   })
// );
models();
routes(server);

const mongoose = require('mongoose');
const Settings = mongoose.model('Settings');
const requestIp = require('request-ip');
const fs = require('fs');

server.pre(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    Settings.findOne({})
        .then(settings => {
            const maintenanceMode = settings.is_maintenance;
            if(maintenanceMode) {
                const data = fs.readFileSync('./ip-whitelist.txt', 'utf8');
                const lines = data.split(/\r?\n/);
                const ipWhiteList = [];
                lines.map(line => { if(line) ipWhiteList.push(line) });
                const clientIp = requestIp.getClientIp(req);
                const isWhiteList = ipWhiteList.includes(clientIp);
                if(isWhiteList) {
                    return next();
                } else {
                    if(!res.headersSent){
                        res.send(503, { statusCode: 503, message: "Server is currently on maintenance. Please try again later" });
                    }
                    res.end();
                }
            } else {
                return next();
            }
        })
        .catch(error => {
            log.error("Error while fetching settings from database");
            return next();
        });
});

var AM = require('./app/routes/modules/account-manager');

server.get(/(^\/$)|(\.(json)$)/, restify.plugins.serveStatic({
  directory: 'contract',
  default: 'index.html'
}));

server.pre(function (req, res, next) {
    if (req.header('session-id')) {
        session.load(req.header('session-id'), function(err, data) {
            if (!data) {
                var myErr = new customErrors.UnauthorizedError({
                    statusCode: 401
                }, 'UnauthorizedError Invalid session id');
                log.error(myErr);
                return next(myErr);
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
});

/*jslint unparam:true*/
// Default error handler. Personalize according to your needs.
server.on('uncaughtException', function(req, res, route, err) {
    log.info('******* Begin Error *******\n%s\n*******\n%s\n******* End Error *******', route, err.stack);
    if (!res.headersSent) {
        return res.send(500, {
            ok: false
        });
    }
    res.write('\n');
    res.end();
});

// log debug message on each request
server.use(function request(req, res, next) {
  logger.debug(req.method, req.url);
  return next();
});

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser({ keepExtensions: true}));

process.on('uncaughtException', (error) => {
    log.error(error);
});

/*server.get('/', function(req, res, next) {
    // console.log("session===:::",req.session);
    res.send(config.app.name);
    return next();
});
*/
server.listen(config.app.port, function() {
    console.log('Application %s listening at %s:%s', config.app.name, config.app.address, config.app.port);
});
