var assert = require('chai').assert;
var err = require('./TestHelper').assertError;

var Utilities = require('../lib/Utilities');

suite('Utilities', function() {
  
  suite('#codeLanguageIdToName()', function() {
    var msg = '"id" is out of range';

    test('expected "c" when id is 1', function() {
      assert.strictEqual(Utilities.codeLanguageIdToName(1), 'c');
    });

    test('expected "c++" when id is 2', function() {
      assert.strictEqual(Utilities.codeLanguageIdToName(2), 'c++');
    });

    test('expected "pascal" when id is 3', function() {
      assert.strictEqual(Utilities.codeLanguageIdToName(3), 'pascal');
    });

    test('expected "go" when id is 1', function() {
      assert.strictEqual(Utilities.codeLanguageIdToName(4), 'go');
    });

    test('expected throwing an error when id is 0 (out of range)', function() {
      err(msg, Utilities.codeLanguageIdToName, 0);
    });

    test('expected throwing an error when id is 5 (out of range)', function() {
      err(msg, Utilities.codeLanguageIdToName, 5);
    });

    test('expected throwing an error when id is -1 (out of range)', function() {
      err(msg, Utilities.codeLanguageIdToName, -1);
    });
  });

  suite('#resultStatusToId', function() {
    var msg = 'no such judge result status: ';

    test('expected 0 when status is "ac"', function() {
      assert.strictEqual(Utilities.resultStatusToId('ac'), 0);
    });

    test('expected 1 when status is "wa"', function() {
      assert.strictEqual(Utilities.resultStatusToId('wa'), 1);
    });

    test('expected 2 when status is "pe"', function() {
      assert.strictEqual(Utilities.resultStatusToId('pe'), 2);
    });

    test('expected 3 when status is "tle"', function() {
      assert.strictEqual(Utilities.resultStatusToId('tle'), 3);
    });

    test('expected 4 when status is "mle"', function() {
      assert.strictEqual(Utilities.resultStatusToId('mle'), 4);
    });

    test('expected 5 when status is "ole"', function() {
      assert.strictEqual(Utilities.resultStatusToId('ole'), 5);
    });

    test('expected 6 when status is "re"', function() {
      assert.strictEqual(Utilities.resultStatusToId('re'), 6);
    });

    test('expected 7 when status is "rf"', function() {
      assert.strictEqual(Utilities.resultStatusToId('rf'), 7);
    });

    test('expected 8 when status is "sj"', function() {
      assert.strictEqual(Utilities.resultStatusToId('sj'), 8);
    });

    test('expected throwing an error when status is "kk" (no such status)', function() {
      err(msg + 'kk', Utilities.resultStatusToId, 'kk');
    });
  });
});
