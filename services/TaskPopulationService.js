var async = require('async')
  , SubmissionPopulationService = require('./SubmissionPopulationService')
  , TestcasePopulationService = require('./TestcasePopulationService')
  , SpecialJudgePopulationService = require('./SpecialJudgePopulationService');

var TaskPopulationService = module.exports = function TaskPopulationService() {};

TaskPopulationService.prototype.populate = function (submissionId, callback) {
  var submissionPopulationService = new SubmissionPopulationService()
    , testcasePopulationService = new TestcasePopulationService()
    , specialJudgePopulationService = new SpecialJudgePopulationService();

  submissionPopulationService.populate(submissionId, function(err, submission) {
    if (err) {
      return callback(err);
    }

    function tc(callback) {
      testcasePopulationService.populate(submission['problem_id'], callback);
    }

    function sj(callback) {
      specialJudgePopulationService.populate(submission['problem_id'], function(err, result) {
        if (err) {
          return callback(err);
        }

        if (result) {
          return callback(null, result);
        }

        callback(null, null);
      });
    }

    async.parallel({
      testcases: tc,
      special_judge: sj
    }, function(err, results) {
      if (err) {
        return callback(err);
      }

      var task = submission
        , i;
      task['testcases'] = results['testcases'];
      task['special_judge'] = results['special_judge'];
      task['submission_id'] = task['id'];
      delete task['id'];
      delete task['problem_id'];
      for (i = 0; i < task['testcases'].length; ++i) {
        task['testcases'][i]['testcase_id'] = task['testcases'][i]['id'];
        delete task['testcases'][i]['id'];
      }

      callback(null, task);
    });
  });
};