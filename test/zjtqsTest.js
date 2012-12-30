var assert = require('chai').assert
  , async = require('async')
  , net = require('net')
  , helper = require('./TestHelper')
  , config = require('../config')
  , zjtqs = require('../lib/zjtqs')
  , Producer = require('../handlers/Producer')
  , Consumer = require('../handlers/Consumer')
  , Utilities = require('../lib/Utilities')
  , CRLF = '\r\n'
  , PORT = 33333;

function createClient() {
  var data = ''
    , client = net.connect(PORT);

  client.on('data', function(chunk) {
    var pos, res;
    data += chunk;
    pos = data.indexOf(CRLF);
    if (pos !== -1) {
      res = data.substr(0, pos);
      data = data.substr(pos + CRLF.length);
      client.emit('response', JSON.parse(res));
    }
  });

  client.on('error', function(err) {
    throw err;
  });

  client.request = function(obj) {
    client.write(JSON.stringify(obj), 'utf8');
    client.write(CRLF);
  };

  return client;
}

function getClientId(client) {
  return client.address().address + ':' + client.address().port;
}

suite('zjtqs', function() {
  var dataSet;

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

  suite('#createServer()', function() {
    var tasks
      , retryTasks
      , producers
      , consumers
      , server
      , client;

    suiteSetup(function() {
      server = zjtqs.createServer();
      server.listen(PORT);
    });

    setup(function() {
      tasks = config.tasks.size();
      retryTasks = config.retryTasks.size();
      producers = config.producers.size();
      consumers = config.consumers.size();
      client = createClient();
    });

    test('accuracy test with a producer connection', function(done) {
      var clientId;

      function connect(callback) {
        client.removeAllListeners('response');
        client.on('response', function(obj) {
          clientId = getClientId(client);
          assert.deepEqual(obj, {result: 'success'});
          assert.strictEqual(config.producers.size(), producers + 1);
          assert.instanceOf(config.producers.get(clientId), Producer);
          callback(null);
        });

        client.request({cmd: 'connect', options: {role: 'producer'}});
      }

      function submitTask(callback) {
        var task = {submission_id: dataSet.submissionId};
        client.removeAllListeners('response');
        client.on('response', function(obj) {
          assert.deepEqual(obj, {result: 'success'});
          assert.strictEqual(config.tasks.size(), tasks + 1);
          assert.deepEqual(config.tasks.poll(), task);
          callback(null);
        });

        client.request({cmd: 'submit task', options: {task: task}});
      }

      async.series([connect, submitTask], done);
    });

    test('accuracy test with a consumer connection', function(done) {
      var clientId;

      function connect(callback) {
        client.removeAllListeners('response');
        client.on('response', function(obj) {
          clientId = getClientId(client);
          assert.deepEqual(obj, {result: 'success'});
          assert.strictEqual(config.consumers.size(), consumers + 1);
          assert.instanceOf(config.consumers.get(clientId), Consumer);
          callback(null);
        });

        client.request({cmd: 'connect', options: {role: 'consumer'}});
      }

      function takeTask(callback) {
        var task = {submission_id: dataSet.submissionId};

        client.removeAllListeners('response');
        client.on('response', function(obj) {
          var result = obj.data
            , i
            , j
            , t
            , index;

          assert.strictEqual(obj.result, 'success');
          assert.strictEqual(config.tasks.size(), tasks - 1);

          assert.isUndefined(result['problem_id']);
          assert.strictEqual(result['submission_id'], dataSet.submissionId);
          assert.strictEqual(result['code_language'], Utilities.codeLanguageIdToName(dataSet.codeLanguage));
          assert.strictEqual(result['code_file_size'], dataSet.codeFileSize);
          assert.strictEqual(result['code_file_md5'], dataSet.codeFileMd5);
          assert.strictEqual(result['code_file_sha1'], dataSet.codeFileSha1);
          assert.strictEqual(result['code_file'], dataSet.codeFile);

          assert.strictEqual(result['testcases'].length, dataSet.testcases.length);
          for (i = 0; i < result['testcases'].length; ++i) {
            t = 0;
            for (j = 0; j < dataSet.testcases.length; ++j) {
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

          callback(null);
        });

        config.tasks.push(task);
        tasks = config.tasks.size();
        client.request({cmd: 'take task'});
      }

      function finishTask(callback) {
        var options = {result: JSON.parse(JSON.stringify(dataSet.result))};

        client.removeAllListeners('response');
        client.on('response', function(obj) {
          clientId = getClientId(client);
          assert.deepEqual(obj, {result: 'success'});

          helper.populateJudgeResult(dataSet.submissionId, function(err, result) {
            var i
              , j
              , t
              , index;

            assert.strictEqual(result.submission['compile_passed'], dataSet.result.compile_passed);
            assert.strictEqual(result.submission['compiler_message'], dataSet.result.compiler_message);

            assert.strictEqual(result.testResults.length, dataSet.result.test_results.length);
            for (i = 0; i < result.testResults.length; ++i) {
              t = 0;
              for (j = 0; j < dataSet.result.test_results.length; ++j) {
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

            callback(null);
          });
        });

        client.request({cmd: 'finish task', options: options});
      }

      async.series([connect, takeTask, finishTask], done);
    });

    test('accuracy test when error occurs', function(done) {
      var clientId;

      client.removeAllListeners('response');
      client.on('response', function(obj) {
        clientId = getClientId(client);
        assert.deepEqual(obj, {result: 'failure', reason: 'internal error'});
        done();
      });

      client.write('JSON.stringify(obj)', 'utf8');
      client.write(CRLF);
    });

    teardown(function(done) {
      client.on('close', function() {
        done();
      });
      client.end();
    });

    suiteTeardown(function(done) {
      server.on('close', function() {
        done();
      });
      server.close();
    });
  });

  suiteTeardown(function(done) {
    helper.clearData(done);
  });
});