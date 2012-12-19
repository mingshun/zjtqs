var Queue = require('./lib/Queue')
  , Map = require('./lib/Map')
  , log4js = require('log4js');

log4js.configure('./log4js_configuration.json', {});
exports.LOG = log4js;

exports.CRLF = '\r\n';

exports.databaseConfig = {
  user: 'dbUser',
  password: 'dbPassword',
  database: 'dbName',
  host: 'dbHost',
  port: 5432
};

exports.userCodePath = './code';
exports.testDataPath = './data';
exports.specialJudgeCodePath = './sjcode';

exports.tasks = new Queue();
exports.retryTasks = new Queue();

exports.producers = new Map();
exports.consumers = new Map();

exports.RETRY_INTERVAL = 2000;

exports.pfx = undefined;
exports.key = undefined;
exports.passphrase = undefined;
exports.cert = undefined;
exports.ca = undefined;
exports.ciphers = undefined;

exports.tcpPort = undefined;
exports.tlsPort = undefined;