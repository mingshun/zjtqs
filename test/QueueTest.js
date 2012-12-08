var assert = require('chai').assert;

var Queue = require('../lib/Queue');

suite('Queue', function() {
  var queue = new Queue();

  test('the operations of queue should be correct', function() {
    var x
      , msg1
      , msg2;

    assert.strictEqual(queue.size(), 0);

    x = queue.poll();
    assert.isUndefined(x);
    assert.strictEqual(queue.toString(), '[]');

    msg1 = 'MSG1';
    queue.push(msg1);
    assert.strictEqual(queue.size(), 1);
    assert.strictEqual(queue.toString(), '["MSG1"]');
    x = queue.poll();
    assert.strictEqual(queue.size(), 0);
    assert.strictEqual(x, msg1);
    
    msg2 = 'MSG2';
    queue.push(msg1);
    queue.push(msg2);
    assert.strictEqual(queue.size(), 2);
    assert.strictEqual(queue.toString(), '["MSG1","MSG2"]');
    x = queue.poll();
    assert.strictEqual(queue.size(), 1);
    assert.strictEqual(x, msg1);
    x = queue.poll();
    assert.strictEqual(queue.size(), 0);
    assert.strictEqual(x, msg2);

    queue.push(msg1);
    queue.push(msg2);
    assert.strictEqual(queue.size(), 2);
    queue.clear();
    assert.strictEqual(queue.size(), 0);
    x = queue.poll();
    assert.isUndefined(x);
  });
});