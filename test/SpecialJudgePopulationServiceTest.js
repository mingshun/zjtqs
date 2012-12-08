var assert = require('chai').assert
  , helper = require('./TestHelper')
  , SpecialJudgePopulationService = require('../services/SpecialJudgePopulationService')
  , Utilities = require('../lib/Utilities');

suite('SpecialJudgePopulationService', function() {
  var dataSet
    , specialJudgePopulationService;

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
    specialJudgePopulationService = new SpecialJudgePopulationService();
  });

  suite('#populate()', function() {
    test('special judge should be populated correctly', function(done) {
      specialJudgePopulationService.populate(dataSet.problemId, function(err, result) {
        assert.isNull(err);

        assert.isUndefined(result['id']);
        assert.strictEqual(result['code_language'], Utilities.codeLanguageIdToName(dataSet.specialJudgeCodeLanguage));
        assert.strictEqual(result['code_file_size'], dataSet.specialJudgeCodeFileSize);
        assert.strictEqual(result['code_file_md5'], dataSet.specialJudgeCodeFileMd5);
        assert.strictEqual(result['code_file_sha1'], dataSet.specialJudgeCodeFileSha1);
        assert.strictEqual(result['code_file'], dataSet.specialJudgeCodeFile);

        done();
      });
    });

    test('special judge should be populated correctly with problem id which is not existed', function(done) {
      specialJudgePopulationService.populate(0, function(err, result) {
        assert.isNull(err);
        assert.isNull(result);
        done();
      });
    });

    test('error should occur when poplating special judge with invalid problem id', function(done) {
      specialJudgePopulationService.populate(false, function(err, result) {
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