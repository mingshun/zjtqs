var fs = require('fs')
  , async = require('async')
  , pg = require('pg')
  , config = require('../config');

var TestcasePopulationService = module.exports = function TestcasePopulationService() {};

TestcasePopulationService.prototype.populate = function(problemId, callback) {

  var SQL_FIND_TESTCASE_BY_PROBLEM_ID = 'SELECT id, weight, input_file_size, input_file_md5, input_file_sha1, '
    + 'answer_file_size, answer_file_md5, answer_file_sha1 FROM zj_testcase WHERE problem_id=$1';

  function findTestcaseByProblemId(problemId, callback) {
    pg.connect(config.databaseConfig, function(err, db) {
      if (err) {
        return callback(err);
      }

      db.query(SQL_FIND_TESTCASE_BY_PROBLEM_ID, [problemId], function(err, result) {
        if (err) {
          return callback(err);
        }

        if (result.rowCount === 0) {
          return callback(new Error('there is no testcase with the specific problem id'));
        }

        callback(null, result.rows);
      });
    });
  }

  function getDataFile(path, callback) {
    fs.readFile(path, function(err, data) {
      if (err) {
        return callback(err);
      }

      callback(null, data.toString('utf8'));
    });
  }

  function getTestData(testcase, callback) {
    var path = config.testDataPath + '/' + testcase.id
      , paths = [path + '.in', path + '.ans'];
    async.map(paths, getDataFile, function(err, results) {
      if (err) {
        return callback(err);
      }

      testcase['input_file'] = results[0];
      testcase['answer_file'] = results[1];
      callback(null, testcase);
    });
  }

  function getTestDatas(testcases, callback) {
    async.map(testcases, getTestData, callback);
  }

  function task0(callback) {
    callback(null, problemId);
  }

  async.waterfall([task0, findTestcaseByProblemId, getTestDatas], function(err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, result);
  });
};