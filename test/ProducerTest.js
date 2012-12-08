var assert = require('chai').assert
  , helper = require('./TestHelper')
  , MockSocket = require('./MockSocket')
  , Producer = require('../handlers/Producer')
  , config = require('../config');

suite('Producer', function() {
  var socket
    , producer
    , ADDRESS = '000.000.000.000'
    , PORT = 2222;

  setup(function() {
    helper.resetConfig();
    socket = new MockSocket();
    socket.remoteAddress = ADDRESS;
    socket.remotePort = PORT;
  });

  suite('#handlers[\'submit task\']', function() {
    setup(function() {
      producer = new Producer(socket);
    });

    test('accuracy test', function() {
      var res = {result: 'success'}
        , task = {submission_id: 111111}
        , options = {task: task}
        , tasks = config.tasks.size()
        , submittedTaskCount = producer.submittedTaskCount;

      producer.handle({cmd: 'submit task', options: options});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks + 1);
      assert.strictEqual(producer.submittedTaskCount, submittedTaskCount + 1);
      assert.deepEqual(config.tasks.poll(), task);
      assert.strictEqual(config.tasks.size(), tasks);
    });

    test('accuracy test when providing invalid task', function() {
      var res = {result: 'failure', reason: 'invalid task when submitting task'}
        , tasks = config.tasks.size()
        , submittedTaskCount = producer.submittedTaskCount;

      producer.handle({cmd: 'submit task', options: {task: {}}});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks);
      assert.strictEqual(producer.submittedTaskCount, submittedTaskCount);

      producer.handle({cmd: 'submit task', options: {task: {submission_id: 'o'}}});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks);
      assert.strictEqual(producer.submittedTaskCount, submittedTaskCount);
    });

    test('accuracy test when not providing task', function() {
      var res = {result: 'failure', reason: 'miss task when submiting task'}
        , tasks = config.tasks.size()
        , submittedTaskCount = producer.submittedTaskCount;

      producer.handle({cmd: 'submit task'});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks);
      assert.strictEqual(producer.submittedTaskCount, submittedTaskCount);
      
      producer.handle({cmd: 'submit task', options: {}});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks);
      assert.strictEqual(producer.submittedTaskCount, submittedTaskCount);
    });
  });
});
