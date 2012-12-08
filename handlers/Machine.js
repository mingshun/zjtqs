var config = require('../config');

var Machine = module.exports = function Machine(socket) {
  this.socket = socket;
};

Machine.prototype.toString = function() {
  return this.socket.remoteAddress + ':' + this.socket.remotePort;
};

Machine.prototype.handle = function(obj) {
  if (obj && obj.cmd && this.handlers && this.handlers[obj.cmd]) {
    this.handlers[obj.cmd].call(this, obj.options);

  } else {
    this.socket.response({result: 'failure', reason: 'invalid command'});
  }
};

Machine.prototype.handlers = {
  'connect': function(options) {
    var Producer = require('./Producer')
      , Consumer = require('./Consumer')
      , socket = this.socket
      , handler
      , name;

    if (options && options.role) {
      if (options.role === 'producer') {
        handler = socket.handler = new Producer(socket);
        name = handler.toString();
        config.producers.put(name, handler);
        socket.on('close', function() {
          config.producers.remove(name);
        });
        socket.response({result: 'success'});

      } else if (options.role === 'consumer') {
        handler = socket.handler = new Consumer(socket);
        name = handler.toString();
        config.consumers.put(name, handler);
        socket.on('close', function() {
          if (handler.currentTask) {
            config.retryTasks.push(handler.currentTask);
          }
          config.consumers.remove(name);
        });
        socket.response({result: 'success'});

      } else {
        socket.response({result: 'failure', reason: 'invalid role'});
      }

    } else {
      socket.response({result: 'failure', reason: 'miss role when connecting'});
    }
  }
};