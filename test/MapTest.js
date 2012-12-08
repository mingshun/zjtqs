var assert = require('chai').assert
  , Map = require('../lib/Map');

suite('Map', function() {
  var map = new Map();

  test('the operations of map should be correct', function(done) {
    var key1 = 'K1'
      , key2 = 'K2'
      , value1 = 'V1'
      , value2 = 'V2'
      , obj = {};

    assert.isUndefined(map.get(key1));
    assert.strictEqual(map.size(), 0);
    assert.strictEqual(map.keys().length, 0);
    assert.strictEqual(map.toString(), '{}');
    
    obj[key1] = value1;
    map.put(key1, value1);
    assert.strictEqual(map.get(key1), value1);
    assert.strictEqual(map.size(), 1);
    assert.strictEqual(map.keys().length, 1);
    assert.strictEqual(map.keys()[0], key1);
    assert.strictEqual(map.toString(), JSON.stringify(obj));

    map.remove(key1);
    assert.isUndefined(map.get(key1));
    assert.strictEqual(map.size(), 0);
    assert.strictEqual(map.keys().length, 0);
    assert.strictEqual(map.toString(), '{}');

    obj[key2] = value2;
    map.put(key1, value1);
    map.put(key2, value2);
    assert.strictEqual(map.get(key1), value1);
    assert.strictEqual(map.get(key2), value2);
    assert.strictEqual(map.size(), 2);
    assert.strictEqual(map.keys().length, 2);
    assert.strictEqual(map.keys()[0], key1);
    assert.strictEqual(map.keys()[1], key2);
    assert.strictEqual(map.toString(), JSON.stringify(obj));

    map.clear();
    assert.isUndefined(map.get(key1));
    assert.isUndefined(map.get(key2));
    assert.strictEqual(map.size(), 0);
    assert.strictEqual(map.keys().length, 0);
    assert.strictEqual(map.toString(), '{}');

    done();
  });
});