var fs = require('fs')
  , async = require('async')
  , pg = require('pg')
  , config = require('../config')
  , Utilities = require('../lib/Utilities');

var SpecialJudgePopulationService = module.exports = function SpecialJudgePopulationService() {};

SpecialJudgePopulationService.prototype.populate = function(problemId, callback) {

  var SQL_FIND_SPECIAL_JUDGE_BY_PROBLEM_ID = 'SELECT id, code_language, code_file_size, code_file_md5, code_file_sha1 '
    + 'FROM zj_special_judge WHERE problem_id=$1';

  function findSpecialJudgeByProblemId(problemId, callback) {
    pg.connect(config.databaseConfig, function(err, db) {
      if (err) {
        return callback(err);
      }

      db.query(SQL_FIND_SPECIAL_JUDGE_BY_PROBLEM_ID, [problemId], function(err, result) {
        if (err) {
          return callback(err);
        }

        if (result.rowCount === 0) {
          return callback(null, null);
        }

        var sj = result.rows[0];
        sj['code_language'] = Utilities.codeLanguageIdToName(sj['code_language']);
        callback(null, sj);
      });
    });
  }

  function getSpecialJudgeCode(sj, callback) {
    if (!sj) {
      return callback(null, null);
    }
    var path = config.specialJudgeCodePath + '/' + sj.id;
    fs.readFile(path, function(err, data) {
      if (err) {
        return callback(err);
      }

      sj['code_file'] = data.toString('utf8');
      callback(null, sj);
    });
  }

  function task0(callback) {
    callback(null, problemId);
  }

  async.waterfall([task0, findSpecialJudgeByProblemId, getSpecialJudgeCode], function(err, result) {
    if (err) {
      return callback(err);
    }

    if (result) {
      delete result['id'];
    }
    callback(null, result);
  });
};