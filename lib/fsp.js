'use strict';

var fs = require('fs');
var iconv = require('iconv-lite');
var jschardet = require('jschardet');
var Promise = require('bluebird'); // jshint ignore:line
Promise.promisifyAll(fs);

fs.createDir = function(dirname) {
  return fs.accessAsync(dirname).catch(function() {
    return fs.mkdirAsync(dirname);
  });
};

fs.deleteFile = function(filename) {
  return fs.unlinkAsync(filename)
    .catch(function() {
      // 忽略文件不存在的错误
    });
};

fs.convertToUtf8 = function(oldPath, newPath) {
  return fs.readFileAsync(oldPath).then(function(buf) {
    return iconv.decode(buf, jschardet.detect(buf).encoding);
  }).then(function(content) {
    return fs.writeFileAsync(newPath, content.trim());
  });
};

// 不能用 fs.access 去判断文件存在，因为被 svn 锁定。
fs.fileExists = function(filename) {
  return fs.statAsync(filename).then(function(stats) {
      return stats.isFile();
    })
    .catch(function() {
      return false;
    });
};

fs.P = Promise;

module.exports = fs;
