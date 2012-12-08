var assert = require('chai').assert
  , helper = require('./TestHelper')
  , MockSocket = require('./MockSocket')
  , Consumer = require('../handlers/Consumer')
  , config = require('../config')
  , Utilities = require('../lib/Utilities');

suite('Consumer', function() {
  var socket
    , consumer
    , ADDRESS = '000.000.000.000'
    , PORT = 2222
    , dataSet;

  suiteSetup(function(done) {
    helper.resetConfig();
    helper.prepareData(function(err, _dataSet) {
      if (err) {
        helper.clearData(function() {
          return done(err);
        });
      }

      dataSet = _dataSet;
      done();
    });
  });

  suite('#handlers[\'take task\']', function() {
    setup(function() {
      socket = new MockSocket();
      socket.remoteAddress = ADDRESS;
      socket.remotePort = PORT;
      consumer = new Consumer(socket);
    });

    test('accuracy test', function(done) {
      var task = {submission_id: dataSet.submissionId}
        , tasks = config.tasks.size();

      socket.on('callback', function() {
        var result = socket.res.data;

        assert.strictEqual(socket.res.result, 'success');

        assert.isUndefined(result['problem_id']);
        assert.strictEqual(result['submission_id'], dataSet.submissionId);
        assert.strictEqual(result['code_language'], Utilities.codeLanguageIdToName(dataSet.codeLanguage));
        assert.strictEqual(result['code_file_size'], dataSet.codeFileSize);
        assert.strictEqual(result['code_file_md5'], dataSet.codeFileMd5);
        assert.strictEqual(result['code_file_sha1'], dataSet.codeFileSha1);
        assert.strictEqual(result['use_file_io'], false);
        assert.strictEqual(result['code_file'], dataSet.codeFile);

        assert.strictEqual(result['testcases'].length, dataSet.testcases.length);
        for (var i = 0; i < result['testcases'].length; ++i) {
          var t = 0, index;
          for (var j = 0; j < dataSet.testcases.length; ++j) {
            if (result['testcases'][i]['testcase_id'] === dataSet.testcases[j].id) {
              index = j;
              ++t;
            }
          }

          assert.strictEqual(t, 1, 'the same testcase appeared more than one time');
          assert.strictEqual(result['testcases'][i]['weight'], dataSet.testcases[index].weight);
          assert.strictEqual(result['testcases'][i]['input_file_size'], dataSet.testcases[index].inputFile.size);
          assert.strictEqual(result['testcases'][i]['input_file_md5'], dataSet.testcases[index].inputFile.md5);
          assert.strictEqual(result['testcases'][i]['input_file_sha1'], dataSet.testcases[index].inputFile.sha1);
          assert.strictEqual(result['testcases'][i]['input_file'], dataSet.testcases[index].inputFile.content);
          assert.strictEqual(result['testcases'][i]['answer_file_size'], dataSet.testcases[index].answerFile.size);
          assert.strictEqual(result['testcases'][i]['answer_file_md5'], dataSet.testcases[index].answerFile.md5);
          assert.strictEqual(result['testcases'][i]['answer_file_sha1'], dataSet.testcases[index].answerFile.sha1);
          assert.strictEqual(result['testcases'][i]['answer_file'], dataSet.testcases[index].answerFile.content);
        }

        assert.strictEqual(result['special_judge']['code_language'], 
          Utilities.codeLanguageIdToName(dataSet.specialJudgeCodeLanguage));
        assert.strictEqual(result['special_judge']['code_file_size'], dataSet.specialJudgeCodeFileSize);
        assert.strictEqual(result['special_judge']['code_file_md5'], dataSet.specialJudgeCodeFileMd5);
        assert.strictEqual(result['special_judge']['code_file_sha1'], dataSet.specialJudgeCodeFileSha1);
        assert.strictEqual(result['special_judge']['code_file'], dataSet.specialJudgeCodeFile);

        assert.strictEqual(consumer.state, Consumer.State.BUSY);
        assert.deepEqual(consumer.currentTask, task);
        assert.strictEqual(config.tasks.size(), tasks);
        done();
      });

      config.tasks.push(task);
      consumer.handle({cmd: 'take task'});
    });

    test('accuracy test when retrying to take task', function(done) {
      var task = {submission_id: dataSet.submissionId}
        , tasks = config.tasks.size();

      socket.on('callback', function() {
        var result = socket.res.data;

        assert.strictEqual(socket.res.result, 'success');
        done();
      });

      consumer.handle({cmd: 'take task'});
      config.tasks.push(task);
    });

    test('accuracy test when error occurs while populating data from database', function(done) {
      var res = {result: 'failure', reason: 'internal error'}
        , task = {submission_id: dataSet.submissionId - 1}
        , tasks = config.tasks.size()
        , retryTasks = config.retryTasks.size();

      socket.on('error', function(err) {});
      socket.on('callback', function() {
        assert.deepEqual(socket.res, res);
        assert.strictEqual(consumer.state, Consumer.State.IDLE);
        assert.isNull(consumer.currentTask);
        assert.strictEqual(config.tasks.size(), tasks);
        assert.strictEqual(config.retryTasks.size(), retryTasks + 1);
        done();
      });

      config.tasks.push(task);
      consumer.handle({cmd: 'take task'});
    });

    test('accuracy test when state is incorrect', function() {
      var res = {result: 'failure', reason: 'state must be idle when taking task'}
        , tasks = config.tasks.size();

      consumer.state = Consumer.State.BUSY;
      consumer.handle({cmd: 'take task'});
      assert.deepEqual(socket.res, res);
      assert.strictEqual(config.tasks.size(), tasks);
    });
  });

  suite('#handlers[\'finish task\']', function() {
    setup(function() {
      socket = new MockSocket();
      socket.remoteAddress = ADDRESS;
      socket.remotePort = PORT;
      consumer = new Consumer(socket);
    });

    test('accuracy test', function(done) {
      var res = {result: 'success'}
        , task = {submission_id: dataSet.submissionId}
        , options = {result: JSON.parse(JSON.stringify(dataSet.result))}
        , finishedTaskCount = consumer.finishedTaskCount;

      socket.on('callback', function() {
        assert.deepEqual(socket.res, res);
        assert.strictEqual(consumer.finishedTaskCount, finishedTaskCount + 1);
        assert.isNull(consumer.currentTask);
        assert.strictEqual(consumer.state, Consumer.State.IDLE);
        
        helper.populateJudgeResult(dataSet.submissionId, function(err, result) {

          assert.strictEqual(result.submission['compile_passed'], dataSet.result.compile_passed);
          assert.strictEqual(result.submission['compiler_message'], dataSet.result.compiler_message);

          assert.strictEqual(result.testResults.length, dataSet.result.test_results.length);
          for (var i = 0; i < result.testResults.length; ++i) {
            var t = 0, index;
            for (var j = 0; j < dataSet.result.test_results.length; ++j) {
              if (result.testResults[i]['testcase_id'] === dataSet.result.test_results[j].testcase_id) {
                index = j;
                ++t;
              }
            }

            assert.strictEqual(t, 1, 'the same test result should appeare only once');

            assert.strictEqual(result.testResults[i]['details'], dataSet.result.test_results[index].details);
            assert.strictEqual(result.testResults[i]['status'], 
              Utilities.resultStatusToId(dataSet.result.test_results[index].status));
            assert.strictEqual(result.testResults[i]['score'], dataSet.result.test_results[index].score);
            assert.strictEqual(result.testResults[i]['time_used'], dataSet.result.test_results[index].time_used);
            assert.strictEqual(result.testResults[i]['memory_used'], dataSet.result.test_results[index].memory_used);
          }

          done();
        });
      });

      consumer.currentTask = task;
      consumer.state = Consumer.State.BUSY;
      consumer.handle({cmd: 'finish task', options: options});
    });

    test('accuracy test when error occurs while persisting data', function(done) {
      var res = {result: 'failure', reason: 'internal error'}
        , task = {submission_id: dataSet.submissionId}
        , options = {result: {submission_id: dataSet.submissionId}}
        , finishedTaskCount = consumer.finishedTaskCount
        , retryTasks = config.retryTasks.size();

      socket.on('error', function(err) {});
      socket.on('callback', function() {
        assert.deepEqual(socket.res, res);
        assert.strictEqual(config.retryTasks.size(), retryTasks + 1);
        assert.isNull(consumer.currentTask);
        assert.strictEqual(consumer.state, Consumer.State.IDLE);
        assert.strictEqual(consumer.finishedTaskCount, finishedTaskCount);
        done();
      });

      consumer.currentTask = task;
      consumer.state = Consumer.State.BUSY;
      consumer.handle({cmd: 'finish task', options: options});
    });

    test('accuracy test when not providing result data', function() {
      var res = {result: 'failure', reason: 'miss result when finishing task'};

      consumer.state = Consumer.State.BUSY;
      consumer.handle({cmd: 'finish task'});
      assert.deepEqual(socket.res, res);
      consumer.handle({cmd: 'finish task', options: {}});
      assert.deepEqual(socket.res, res);
    });

    test('accuracy test when submission id is incorrect', function(done) {
      var res = {result: 'failure', reason: 'incorrect task submission_id'}
        , task = {submission_id: dataSet.submissionId}
        , options = {result: {submission_id: dataSet.submissionId - 1}};

      consumer.currentTask = task;
      consumer.state = Consumer.State.BUSY;
      consumer.handle({cmd: 'finish task', options: options});
      assert.deepEqual(socket.res, res);
      done();
    });

    test('accuracy test when state is incorrect', function() {
      var res = {result: 'failure', reason: 'state must be busy when taking task'};

      consumer.state = Consumer.State.IDLE;
      consumer.handle({cmd: 'finish task'});
      assert.deepEqual(socket.res, res);
    });

  });

  suiteTeardown(function(done) {
    helper.clearData(done);
  });
});