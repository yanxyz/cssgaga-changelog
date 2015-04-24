'use strict';

var fsp = require('./fsp');
var path = require('path');
var Promise = require('bluebird'); // jshint ignore:line
var exec = Promise.promisify(require('child_process').exec);

const SVN_DIR = path.join(__dirname, '../cssgaga');
const LOG_DIR = path.join(__dirname, '../log');
const TXT_FILE = 'current.txt';
const TXT_PATH = path.join(SVN_DIR, TXT_FILE);

module.exports = function(fromRev, toRev) {
  if (!fromRev) {
    return checkoutLast();
  }

  if (!toRev || fromRev === toRev) {
    return fsp.createDir(LOG_DIR).then(function() {
      return checkout(fromRev);
    });
  }

  if (fromRev > toRev) {
    console.log(arguments);
    throw new Error('Wrong: fromRev > toRev');
  }

  let arr = [];

  for (let n = fromRev; n <= toRev; ++n) {
    arr.push(n);
  }

  // 串行，即一个个的签出，因为签出时 svn 锁定
  return fsp.createDir(LOG_DIR)
    .then(function() {
      return Promise.reduce(arr, function(arr, x) {
        return checkout(x).then(function(x) {
          if (x >= 0) {
            arr.push(x);
          }
          return arr;
        });
      }, []);
    });
};

// 签出指定的修订， 如果文件已存在则跳过。
// 返回有 current.txt 的修订版本号
function checkout(n) {
  var logFile = path.join(LOG_DIR, n + '.txt');
  return fsp.fileExists(logFile)
    .then(function(exists) {
      if (exists) {
        console.log('%d.txt already exists.', n);
        return n;
      }

      return exec('svn update -r' + n + ' ' + TXT_FILE, {
          cwd: SVN_DIR,
          timeout: 10000
        })
        .then(function() {
          return fsp.fileExists(TXT_PATH);
        })
        .then(function(exists) {
          if (exists) {
            return fsp.convertToUtf8(TXT_PATH, logFile)
              .then(function() {
                console.log('Updated to revision %d.', n);
                return n;
              });
          } else {
            console.log('Updated to revision %d, but not have %s', n, TXT_FILE);
          }
        });
    });
}

function checkoutLast() {
  return exec('svn update ' + TXT_FILE, {
      cwd: SVN_DIR,
      timeout: 5000
    })
    .then(function(output) {
      // console.log(output);
      var n = output[0].match(/\d+/)[0];
      // 必须是数字
      n = Number(n);
      var logFile = path.join(LOG_DIR, n + '.txt');
      return fsp.convertToUtf8(TXT_PATH, logFile)
        .then(function() {
          // console.log('Updated to revision %d.', n);
          return n;
        });
    });
}
