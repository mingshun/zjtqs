var assert = require('chai').assert
  , helper = require('./TestHelper')
  , SubmissionPopulationService = require('../services/SubmissionPopulationService')
  , Utilities = require('../lib/Utilities');

suite('SubmissionPopulationService', function() {
  var dataSet
    , submissionPopulationService;

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
    submissionPopulationService = new SubmissionPopulationService();
  });

  suite('#populate()', function() {
    test('submission should be populated correctly', function(done) {
      submissionPopulationService.populate(dataSet.submissionId, function(err, result) {
        assert.isNull(err);

        assert.strictEqual(result['id'], dataSet.submissionId);
        assert.strictEqual(result['problem_id'], dataSet.problemId);
        assert.strictEqual(result['code_language'], Utilities.codeLanguageIdToName(dataSet.codeLanguage));
        assert.strictEqual(result['code_file_size'], dataSet.codeFileSize);
        assert.strictEqual(result['code_file_md5'], dataSet.codeFileMd5);
        assert.strictEqual(result['code_file_sha1'], dataSet.codeFileSha1);
        assert.strictEqual(result['code_file'], dataSet.codeFile);

        done();
      });
    });

    test('error should occur when populating submission with id which is not existed', function(done) {
      submissionPopulationService.populate(0, function(err, result) {
        assert.strictEqual(err.message, 'there is no submission with specific id(=' + 0 + ')');
        assert.isUndefined(result);
        done();
      });
    });

    test('error should occur when poplating submission with invalid id', function(done) {
      submissionPopulationService.populate(false, function(err, result) {
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