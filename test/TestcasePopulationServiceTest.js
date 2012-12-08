var assert = require('chai').assert
  , helper = require('./TestHelper')
  , TestcasePopulationService = require('../services/TestcasePopulationService');

suite('TestcasePopulationService', function() {
  var dataSet
    , testcasePopulationService;

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
    testcasePopulationService = new TestcasePopulationService();
  });

  suite('#populate()', function() {
    test('testcases should be populated correctly', function(done) {
      testcasePopulationService.populate(dataSet.problemId, function(err, results) {
        assert.isNull(err);

        assert.strictEqual(results.length, dataSet.testcases.length);
        for (var i = 0; i < results.length; ++i) {
          var t = 0, index;
          for (var j = 0; j < dataSet.testcases.length; ++j) {
            if (results[i]['id'] === dataSet.testcases[j].id) {
              index = j;
              ++t;
            }
          }

          assert.strictEqual(t, 1, 'the same testcase should appeare only once');
          assert.strictEqual(results[i]['weight'], dataSet.testcases[index].weight);
          assert.strictEqual(results[i]['input_file_size'], dataSet.testcases[index].inputFile.size);
          assert.strictEqual(results[i]['input_file_md5'], dataSet.testcases[index].inputFile.md5);
          assert.strictEqual(results[i]['input_file_sha1'], dataSet.testcases[index].inputFile.sha1);
          assert.strictEqual(results[i]['input_file'], dataSet.testcases[index].inputFile.content);;
          assert.strictEqual(results[i]['answer_file_size'], dataSet.testcases[index].answerFile.size);
          assert.strictEqual(results[i]['answer_file_md5'], dataSet.testcases[index].answerFile.md5);
          assert.strictEqual(results[i]['answer_file_sha1'], dataSet.testcases[index].answerFile.sha1);
          assert.strictEqual(results[i]['answer_file'], dataSet.testcases[index].answerFile.content);
        }

        done();
      });
    });

    test('error should occur when populating testcases with problem id which is not existed', function(done) {
      testcasePopulationService.populate(0, function(err, results) {
        assert.strictEqual(err.message, 'there is no testcase with the specific problem id');
        assert.isUndefined(results);
        done();
      });
    });

    test('error should occur when poplating testcases with invalid problem id', function(done) {
      testcasePopulationService.populate(false, function(err, results) {
        assert.isNotNull(err);
        assert.isUndefined(results);
        done();
      });
    });
  });

  suiteTeardown(function(done) {
    helper.clearData(done);
  });
});