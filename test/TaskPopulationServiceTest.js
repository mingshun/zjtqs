var assert = require('chai').assert
  , helper = require('./TestHelper')
  , TaskPopulationService = require('../services/TaskPopulationService')
  , Utilities = require('../lib/Utilities');

suite('TaskPopulationService', function() {
  var dataSet
    , taskPopulationService;
  
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
    taskPopulationService = new TaskPopulationService();
  });

  suite('#populate()', function() {
    test('task with special judge should be populated correctly', function(done) {
      taskPopulationService.populate(dataSet.submissionId, function(err, result) {
        assert.isNull(err);

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

        done();
      });
    });

    test('task with special judge should be populated corrected', function(done) {
      helper.deleteSpecialJudge(function(err) {
        if (err) {
          throw err;
        }

        taskPopulationService.populate(dataSet.submissionId, function(err, result) {
          assert.isNull(err);
          assert.isNull(result['special_judge']);

          done();
        });
      });
    });

    test('error should occur when populating task with submission id which is not existed', function(done) {
      taskPopulationService.populate(0, function(err, result) {
        assert.strictEqual(err.message, 'there is no submission with specific id(=' + 0 + ')');
        assert.isUndefined(result);

        done();
      });
    });

    test('error should occur when poplating task with invalid id', function(done) {
      taskPopulationService.populate(false, function(err, result) {
        assert.isNotNull(err);
        assert.isUndefined(result);
        
        done();
      });
    });
  });

  suiteTeardown(function(done) {
    helper.clearData(done);
  });
});