'use strict';

var fsp = require('./fsp');
var path = require('path');

const LOG_DIR = path.join(__dirname, '../log');

module.exports = function(n) {
  if (typeof n === 'number') {
    return fsp.readFileAsync(path.join(LOG_DIR, n + '.txt'), 'utf8')
    .then(function(content) {
      return parse(content, n);
    });
  } else {
    return fsp.P.resolve(parse(n));
  }
};

function parse(str, n) {
  // 61.txt
  str = str.replace('117 重要更新！', '117\r\n重要更新！');

  var re = /^\s*\d+\s*$/mg;
  var vers = str.match(re);
  var contents = str.split(re);
  contents.shift();

  if (!vers || vers.length !== contents.length) {
    console.log(str, str.length, vers, contents);
    throw new Error(n + '.txt split wrong');
  }

  var ret = {};
  vers.forEach(function(x, i) {
    ret[x.trim()] = contents[i].trim();
  });
  return ret;
}
