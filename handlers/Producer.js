var util = require('util')
  , Machine = require('./Machine')
  , config = require('../config');

function Producer() {
  Machine.apply(this, arguments);
  this.submittedTaskCount = 0;
}

util.inherits(Producer, Machine);
module.exports = Producer;

Producer.prototype.handlers = {
  'submit task': function(options) {
    var socket = this.socket;
    if (options && options.task) {
      if (options.task.submission_id && typeof options.task.submission_id === 'number') {
        config.tasks.push(options.task);
        ++ this.submittedTaskCount;
        socket.response({result: 'success'});

      } else {
        socket.response({result: 'failure', reason: 'invalid task when submitting task'});
      }

    } else {
      socket.response({result: 'failure', reason: 'miss task when submiting task'});
    }
  }
};