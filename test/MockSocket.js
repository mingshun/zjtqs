var events = require('events')
  , util = require('util');

function MockSocket() {
  this.res = null;
  events.EventEmitter.call(this);
}
util.inherits(MockSocket, events.EventEmitter);
module.exports = MockSocket;

MockSocket.prototype.response = function(obj) {
  this.res = obj;
  this.emit('callback');
};