var Map = module.exports = function Map() {
  this.map = {};
};

Map.prototype.put = function(key, value) {
  this.map[key] = value;
};

Map.prototype.get = function(key) {
  return this.map[key];
};

Map.prototype.remove = function(key) {
  delete this.map[key];
};

Map.prototype.size = function() {
  return Object.keys(this.map).length;
};

Map.prototype.keys = function() {
  return Object.keys(this.map);
};

Map.prototype.toString = function() {
  return JSON.stringify(this.map);
};

Map.prototype.clear = function() {
  this.map = {};
};