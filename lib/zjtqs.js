var net = require('net')
  , tls = require('tls')
  , config = require('../config')
  , Machine = require('../handlers/Machine')
  , tcpOptions
  , rlsOptions;

tcpOptions = {
  allowHalfOpen: false
};

rlsOptions = {
  pfx: config.pfx,
  key: config.key,
  passphrase: config.passphrase,
  cert: config.cert,
  ca: config.ca,
  ciphers: config.ciphers,
  requestCert: true,
  rejectUnauthorized: true
};

function createServer() {
  var logger = config.LOG.getLogger()
    , server;

  if (typeof arguments[0] === 'boolean' && arguments[0]) {
    server = tls.createServer(rlsOptions);
    logger.info('tls server created');
  } else {
    server = net.createServer(tcpOptions);
    logger.info('tcp server created');
  }

  server.on('connection', function(socket) {
    var handler = socket.handler = new Machine(socket);
    socket.data = '';

    socket.response = function(obj) {
      var res = JSON.stringify(obj);
      logger.info('response: ' + res + '(--> ' + handler.toString() + ')');

      socket.write(res, 'utf8');
      socket.write(config.SOCKET_TEMINATOR);
    };

    socket.on('request', function(obj) {
      var req = JSON.stringify(obj);
      logger.info('request: ' + req + '(<-- ' + handler.toString() + ')');

      socket.handler.handle(obj);
    });

    socket.on('data', function(chunk) {
      var endpos
        , obj;

      socket.data += chunk;
      endpos = socket.data.indexOf(config.SOCKET_TEMINATOR);
      if (endpos !== -1) {
        try {
          obj = JSON.parse(socket.data.substr(0, endpos));
          socket.data = socket.data.substr(endpos + config.SOCKET_TEMINATOR.length);
          socket.emit('request', obj);

        } catch (err) {
          socket.response({result: 'failure', reason: 'internal error'});
          socket.emit('error', err);
        }
      }
    });

    socket.on('error', function(err) {
      logger.error(err.stack);
    });
  });

  return server;
}

module.exports = {
  createServer: createServer
};