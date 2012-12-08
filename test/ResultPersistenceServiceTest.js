var assert = require('chai').assert
  , helper = require('./TestHelper')
  , ResultPersistenceService = require('../services/ResultPersistenceService')
  , Utilities = require('../lib/Utilities')
  , config = require('../config');

suite('ResultPersistenceService', function() {
  var dataSet
    , dbConfig = config.databaseConfig
    , resultPersistenceService;

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

  setup(function() {
    resultPersistenceService = new ResultPersistenceService();
  });

  suite('#persist()', function() {
    test('result should be persisted corrently', function(done) {
      var obj = JSON.parse(JSON.stringify(dataSet.result));
      resultPersistenceService.persist(obj, function(err) {
        assert.isNull(err);

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
    });

    test('error should occur when "judgeResult" is undefined', function(done) {
      var msg = '"judgeResult" is undefined';
      resultPersistenceService.persist(undefined, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when "judgeResult" is null', function(done) {
      var msg = '"judgeResult" is null';
      resultPersistenceService.persist(null, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when "judgeResult" is not an object', function(done) {
      var msg = 'the type of "judgeResult" is not object';
      resultPersistenceService.persist(1, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when number value is undefined', function(done) {
      var msg = '"judgeResult#test_results#0#score" is undefined';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = [];
      obj.test_results[0] = {};
      obj.test_results[0].testcase_id = 1;
      obj.test_results[0].details = null;
      obj.test_results[0].score = undefined;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when number value is null', function(done) {
      var msg = '"judgeResult#test_results#0#score" is null';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = [];
      obj.test_results[0] = {};
      obj.test_results[0].testcase_id = 1;
      obj.test_results[0].details = null;
      obj.test_results[0].score = null;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when number value is not a number', function(done) {
      var msg = 'the type of "judgeResult#test_results#0#score" is not number';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = [];
      obj.test_results[0] = {};
      obj.test_results[0].testcase_id = 1;
      obj.test_results[0].details = null;
      obj.test_results[0].score = '';
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when number value is less than 0', function(done) {
      var msg = '"judgeResult#test_results#0#score" should not be negative';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = [];
      obj.test_results[0] = {};
      obj.test_results[0].testcase_id = 1;
      obj.test_results[0].details = null;
      obj.test_results[0].score = -1;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when id is undefined', function(done) {
      var msg = '"judgeResult#submission_id" is undefined';
      var obj = {};
      obj.submission_id = undefined;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when id is null', function(done) {
      var msg = '"judgeResult#submission_id" is null';
      var obj = {};
      obj.submission_id = null;
      resultPersistenceService.persist(obj, function(err) {
        assert.isNotNull(err);
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when id is not a number', function(done) {
      var msg = 'the type of "judgeResult#submission_id" is not number';
      var obj = {};
      obj.submission_id = '';
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when id is not positive', function(done) {
      var msg = '"judgeResult#submission_id" should be positive';
      var obj = {};
      obj.submission_id = 0;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when boolean value is undefined', function(done) {
      var msg = '"judgeResult#compile_passed" is undefined';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = undefined;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when boolean value is null', function(done) {
      var msg = '"judgeResult#compile_passed" is null';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = null;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when boolean value is not a boolean', function(done) {
      var msg = 'the type of "judgeResult#compile_passed" is not boolean';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = '';
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when string value is undefined', function(done) {
      var msg = '"judgeResult#compiler_message" is undefined';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = undefined;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when string value is not a string while it is not null', function(done) {
      var msg = 'the type of "judgeResult#compiler_message" is not string';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = 3;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when array value is undefined', function(done) {
      var msg = '"judgeResult#test_results" is undefined';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = undefined;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when array value is null', function(done) {
      var msg = '"judgeResult#test_results" is null';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = null;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when array value is not an object', function(done) {
      var msg = 'the type of "judgeResult#test_results" is not object';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = 1;
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when the length of an array is not positive', function(done) {
      var msg = '"judgeResult#test_results#length" should be positive';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = [];
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });

    test('error should occur when array value is not instance of Array', function(done) {
      var msg = '"judgeResult#test_results" is not an instance of Array';
      var obj = {};
      obj.submission_id = 1;
      obj.compile_passed = true;
      obj.compiler_message = null;
      obj.test_results = {};
      resultPersistenceService.persist(obj, function(err) {
        assert.strictEqual(err.message, msg);
        done();
      });
    });
  });

  suiteTeardown(function(done) {
    helper.clearData(done);
  });
});
