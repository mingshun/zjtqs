var fs = require('fs')
  , async = require('async')
  , pg = require('pg')
  , config = require('../config')
  , Utilities = require('../lib/Utilities');

var SubmissionPopulationService = module.exports = function SubmissionPopulationService() {};

/**
 * Populate the submission object with the specific submission id.
 *
 * @param {Number} id
 * @param {Function} callback
 * @api public
 */
SubmissionPopulationService.prototype.populate = function(id, callback) {

  var SQL_FIND_SUBMISSION_BY_ID = 'SELECT id, problem_id, code_language, code_file_size, code_file_md5, '
    + 'code_file_sha1 FROM zj_submission WHERE id=$1';

  function findSubmissionById(id, callback) {
    pg.connect(config.databaseConfig, function(err, db) {
      if (err) {
        return callback(err);
      }

      db.query(SQL_FIND_SUBMISSION_BY_ID, [id], function(err, result) {
        if (err) {
          return callback(err);
        }

        if (result.rowCount === 0) {
          return callback(new Error('there is no submission with specific id(=' + id + ')'));
        }

        var submission = result.rows[0];
        submission['code_language'] = Utilities.codeLanguageIdToName(submission['code_language']);
        callback(null, submission);
      });
    });
  }

  function getUserCode(submission, callback) {
    var path = config.userCodePath + '/' + submission.id;
    fs.readFile(path, function(err, data) {
      if (err) {
        return callback(err);
      }

      submission['code_file'] = data.toString('utf8');
      callback(null, submission);
    });
  }

  function task0(callback) {
    callback(null, id);
  }

  async.waterfall([task0, findSubmissionById, getUserCode], function(err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, result);
  });
};