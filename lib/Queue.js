var Queue = module.exports = function Queue() {
  this.queue = [];
};

Queue.prototype.push = function(obj) {
  this.queue.push(obj);
};

Queue.prototype.poll = function() {
  return this.queue.shift();
};

Queue.prototype.size = function() {
  return this.queue.length;
};

Queue.prototype.clear = function() {
  this.queue = [];
};

Queue.prototype.toString = function() {
  return JSON.stringify(this.queue);
};