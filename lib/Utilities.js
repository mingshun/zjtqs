/**
 * Converts code language id persistent in database into the specific name.
 *
 * @param {Number} id
 * @return {String}
 * @api public
 */
exports.codeLanguageIdToName = function(id) {
  var languages = ['', 'c', 'c++', 'pascal', 'go'];

  if (id > 0 && id < languages.length) {
    return languages[id];
  }
  throw new Error('"id" is out of range');
};

/**
 * Converts judge result status into the specific id persisent in database.
 *
 * @param {String} s
 * @return {Number}
 * @api public
 */
exports.resultStatusToId = function(s) {
  var status = ['ac', 'wa', 'pe', 'tle', 'mle', 'ole', 're', 'rf', 'sj']
    , i;

  for (i = 0; i < status.length; ++i) {
    if (s === status[i]) {
      return i;
    }
  }
  throw new Error('no such judge result status: ' + s);
};