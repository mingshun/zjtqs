var assert = require('chai').assert
  , helper = require('./TestHelper')
  , MockSocket = require('./MockSocket')
  , Machine = require('../handlers/Machine')
  , Producer = require('../handlers/Producer')
  , Consumer = require('../handlers/Consumer')
  , config = require('../config');

suite('Machine', function() {
  var socket
    , machine
    , ADDRESS = '000.000.000.000'
    , PORT = 2222;

  setup(function() {
    helper.resetConfig();
    socket = new MockSocket();
    socket.remoteAddress = ADDRESS;
    socket.remotePort = PORT;
  });

  suite('#toString()', function() {
    setup(function() {
      machine = new Machine(socket);
    });

    test('accuracy test', function() {
      assert.strictEqual(machine.toString(), ADDRESS + ':' + PORT);
    });
  });

  suite('#handle()', function() {
    var res = {result: 'failure', reason: 'invalid command'};

    setup(function() {
      machine = new Machine(socket);
    });

    test('accuracy test', function() {
      var OPTION = '[HANDLER OPTION]'
        , RETURN = '[HANDLER RETURN]';
      machine.handlers.me = function(options) {
        this.socket.response(options.option + '-' + RETURN);
      };
      machine.handle({cmd: 'me', options: {option: OPTION}})
      assert.strictEqual(socket.res, OPTION  + '-' + RETURN);
    });

    test('accuracy test when no obj', function() {
      machine.handle(null);
      assert.deepEqual(socket.res, res);
    });

    test('accuracy test when no obj.cmd', function() {
      machine.handle({});
      assert.deepEqual(socket.res, res);
    });

    test('accuracy test when no handlers', function () {
      machine.handle({cmd: 'disconnect'});
      assert.deepEqual(socket.res, res);
    });

    test('accuracy test when no handlers[obj.cmd]', function() {
      machine.handle({cmd: 'close'});
      assert.deepEqual(socket.res, res);
    });
  });

  suite('#handlers#connect', function() {
    setup(function() {
      machine = new Machine(socket);
    });

    test('accuracy test when providing a producer', function() {
      var res = {result: 'success'}
        , producers = config.producers.size();
      machine.handle({cmd: 'connect', options: {role: 'producer'}});
      assert.deepEqual(socket.res, res);
      assert.isTrue(config.producers.get(socket.handler.toString()) instanceof Producer);
      assert.strictEqual(config.producers.size(), producers + 1);
      socket.emit('close');
      assert.strictEqual(config.producers.size(), producers);
    });

    test('accuracy test when providing a consumer', function() {
      var res = {result: 'success'}
        , consumers = config.consumers.size();
        machine.handle({cmd: 'connect', options: {role: 'consumer'}});
        assert.deepEqual(socket.res, res);
        assert.isTrue(config.consumers.get(socket.handler.toString()) instanceof Consumer);
        assert.strictEqual(config.consumers.size(), consumers + 1);
        socket.emit('close');
        assert.strictEqual(config.consumers.size(), consumers);
    });

    test('accuracy test when providing invalid role', function() {
      var res = {result: 'failure', reason: 'invalid role'};
      machine.handle({cmd: 'connect', options: {role: 'role'}});
      assert.deepEqual(socket.res, res);
    });

    test('accuracy test when not providing role', function() {
      var res = {result: 'failure', reason: 'miss role when connecting'};
      machine.handle({cmd: 'connect'});
      assert.deepEqual(socket.res, res);
      machine.handle({cmd: 'connect', options: {}});
      assert.deepEqual(socket.res, res);
    });
  });
});



