var async = require('async')
  , pg = require('pg')
  , config = require('../config')
  , Utilities = require('../lib/Utilities');

var ResultPersistenceService = module.exports = function ResultPersistenceService() {};

ResultPersistenceService.prototype.persist = function(judgeResult, callback) {

  var SQL_UPDATE_SUBMISSION = 'UPDATE zj_submission SET compile_passed = $1, compiler_message = $2 WHERE id = $3'
    , SQL_INSERT_TEST_RESULT = 'INSERT INTO zj_test_result (submission_id, testcase_id, status, details, score, '
        + 'time_used, memory_used) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';

  function checkUndefined(name, value) {
    if (typeof (value) === 'undefined') {
      throw new Error('"' + name + '" is undefined');
    }
  }

  function checkNull(name, value) {
    if (value === null) {
      throw new Error('"' + name + '" is null');
    }
  }

  function checkType(name, value, type) {
    if (typeof (value) !== type) {
      throw new Error('the type of "' + name + '" is not ' + type);
    }
  }

  function checkInstance(name, value, instance) {
    if (!(value instanceof instance)) {
      throw new Error('"' + name + '" is not an instance of ' + instance.name);
    }
  }

  function checkPositive(name, value) {
    if (value <= 0) {
      throw new Error('"' + name + '" should be positive');
    }
  }

  function checkNonNegative(name, value) {
    if (value < 0) {
      throw new Error('"' + name + '" should not be negative');
    }
  }

  function checkNumber(name, value) {
    checkUndefined(name, value);
    checkNull(name, value);
    checkType(name, value, 'number');
    checkNonNegative(name, value);
  }

  function checkId(name, value) {
    checkUndefined(name, value);
    checkNull(name, value);
    checkType(name, value, 'number');
    checkPositive(name, value);
  }

  function checkBoolean(name, value) {
    checkUndefined(name, value);
    checkNull(name, value);
    checkType(name, value, 'boolean');
  }

  function checkString(name, value) {
    checkUndefined(name, value);
    if (value !== null) {
      checkType(name, value, 'string');
    }
  }

  function checkArray(name, value) {
    checkUndefined(name, value);
    checkNull(name, value);
    checkType(name, value, 'object');
    checkInstance(name, value, Array);
    checkPositive(name + '#length', value.length);
  }

  function validateResult(judgeResult) {
    checkId('judgeResult#submission_id', judgeResult['submission_id']);
    checkBoolean('judgeResult#compile_passed', judgeResult['compile_passed']);
    checkString('judgeResult#compiler_message', judgeResult['compiler_message']);

    checkArray('judgeResult#test_results', judgeResult['test_results']);
    for (var i = 0; i < judgeResult['test_results'].length; ++i) {
      checkId('judgeResult#test_results#' + i +'#testcase_id', judgeResult['test_results'][i]['testcase_id']);
      checkString('judgeResult#test_results#' + i +'#details', judgeResult['test_results'][i]['details']);
      checkNumber('judgeResult#test_results#' + i +'#score', judgeResult['test_results'][i]['score']);
      checkNumber('judgeResult#test_results#' + i +'#time_used', judgeResult['test_results'][i]['time_used']);
      checkNumber('judgeResult#test_results#' + i +'#memory_used', judgeResult['test_results'][i]['memory_used']);
    }
  }

  function convertStatusToId(judgeResult) {
    for (var i = 0; i < judgeResult['test_results'].length; ++i) {
      judgeResult['test_results'][i]['status'] = Utilities.resultStatusToId(judgeResult['test_results'][i]['status']);
    }
  }

  try {
    checkUndefined('judgeResult', judgeResult);
    checkNull('judgeResult', judgeResult);
    checkType('judgeResult', judgeResult, 'object');
    validateResult(judgeResult);
    convertStatusToId(judgeResult);
  } catch (err) {
    return callback(err);
  }

  pg.connect(config.databaseConfig, function(err, db) {
    function beginTransaction(callback) {
      db.query('BEGIN', callback);
    }

    function commitTransaction(callback) {
      db.query('COMMIT', callback);
    }

    function rollbackTransaction(callback) {
      db.query('ROLLBACK', callback);
    }

    function updateSubmission(callback) {
      db.query(SQL_UPDATE_SUBMISSION, [judgeResult.compile_passed, judgeResult.compiler_message,
        judgeResult.submission_id], callback);
    }

    function insertTestResult(testResult, callback) {
      db.query(SQL_INSERT_TEST_RESULT, [judgeResult.submission_id, testResult.testcase_id, testResult.status,
        testResult.details, testResult.score, testResult.time_used, testResult.memory_used], callback);
    }

    function insertTestResults(callback) {
      async.forEachSeries(judgeResult.test_results, insertTestResult, callback);
    }

    db.pauseDrain();
    async.series([beginTransaction, updateSubmission, insertTestResults, commitTransaction], function(err) {
      if (err) {
        rollbackTransaction(null);
        db.resumeDrain();
        return callback(err);
      }

      db.resumeDrain();
      callback(null);
    });
  });
};