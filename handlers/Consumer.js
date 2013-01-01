var util = require('util')
  , Machine = require('./Machine')
  , config = require('../config')
  , TaskPopulationService = require('../services/TaskPopulationService')
  , ResultPersistenceService = require('../services/ResultPersistenceService');

function Consumer() {
  Machine.apply(this, arguments);
  this.finishedTaskCount = 0;
  this.currentTask = null;
  this.state = Consumer.State.IDLE;
}

Consumer.State = Object.freeze({
  IDLE: {id: 1, name: 'idle'},
  BUSY: {id: 2, name: 'busy'}
});

util.inherits(Consumer, Machine);
module.exports = Consumer;

Consumer.prototype.handlers = {
  'take task': function() {
    var self = this
      , func = arguments.callee
      , socket = this.socket
      , taskPopulationService = new TaskPopulationService()
      , task;

    if (this.state !== Consumer.State.IDLE) {
      socket.response({result: 'failure', reason: 'state must be idle when taking task'});
      return;
    }

    if (config.tasks.size() === 0) {
      setTimeout(function() {
        func.call(self);
      }, config.RETRY_INTERVAL);
      return;
    }

    task = config.tasks.poll();
    taskPopulationService.populate(task.submission_id, function(err, result) {
      if (err) {
        config.retryTasks.push(task);
        socket.response({result: 'failure', reason: 'internal error'});
        socket.emit('error', err);
        return;
      }

      self.currentTask = task;
      self.state = Consumer.State.BUSY;
      socket.response({result: 'success', data: result});
    });
  },

  'finish task': function(options) {
    var self = this
      , socket = this.socket
      , resultPersistenceService = new ResultPersistenceService()
      , logger = config.LOG.getLogger();

    // check state of consumer
    if (this.state !== Consumer.State.BUSY) {
      socket.response({result: 'failure', reason: 'state must be busy when taking task'});
      return;
    }

    // check if error occured while judging
    if (options && options.error) {
      logger.warn('error message from judge engine: ' + options.error);
      config.retryTasks.push(self.currentTask);
      self.currentTask = null;
      self.state = Consumer.State.IDLE;
      socket.response({result: 'success'});
      return;
    }

    // try to persist result data
    if (options && options.result) {
      // check submission id
      if (options.result.submission_id && options.result.submission_id !== this.currentTask.submission_id) {
        socket.response({result: 'failure', reason: 'incorrect task submission_id'});
        return;
      }

      resultPersistenceService.persist(options.result, function(err) {
        if (err) {
          config.retryTasks.push(self.currentTask);
          self.currentTask = null;
          self.state = Consumer.State.IDLE;
          socket.response({result: 'failure', reason: 'internal error'});
          socket.emit('error', err);
          return;
        }

        ++ self.finishedTaskCount;
        self.currentTask = null;
        self.state = Consumer.State.IDLE;
        socket.response({result: 'success'});
      });

    } else {
      socket.response({result: 'failure', reason: 'miss result when finishing task'});
    }
  }
};