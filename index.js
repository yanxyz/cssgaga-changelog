#!/usr/bin/env node

// current.txt 记录了版本更新历史，因此任务就是得到并解析它。
// https://code.google.com/p/cssgaga/source/list?num=25&start=14
//
// SVN 只签出 current.txt
// 例如: svn update -r30 current.txt
//
// 将签出的 current.txt 放到 log 目录下面。
// 已有的就不再从服务器上签出。
//
// 有的 current.txt 里面的版本号不是连续的。
// 不同的修订版本有重叠的部分，而且还不一样。
// 按修订版本，新的覆盖旧的。
//
// current.txt 的编码有 gbk，也有 utf8（有 BOM 或没有）
// 统一保存为 utf8

'use strict';

var fsp = require('./lib/fsp');
var checkout = require('./lib/checkout');
var parse = require('./lib/parse');
var objectAssign = require('object-assign');

var argv = require('yargs')
  .options({
    t: {
      alias: 'test',
      type: 'boolean',
      describe: '测试合并本地的更新记录'
    },
    f: {
      alias: 'force',
      type: 'boolean',
      describe: '强制检查 google code 上的最后修订。'
    }
  })
  .help('h')
  .alias('h', 'help')
  .epilogue([
    'CssGaGa 已停止在 google code 上的更新，最后修订为 r314',
    '默认不检查最后修订，选项 -f 强制检查最后修订。'
  ].join('\n'))
  .argv;

try {
  fsp.mkdirSync('./output');
} catch (err) {

}

const CHANGLOG_FILE = './output/changelog.txt';
const JSON_FILE = './output/log.json';
const LAST_REV = 314;
var data;

if (argv.test) {
  fsp.deleteFile(CHANGLOG_FILE)
    .then(function() {
      return check(LAST_REV);
    });
} else if (argv.force) {
  check();
} else {
  check(LAST_REV);
}

function check(lastRev) {
  // 不存在 CHANGLOG_FILE 则重新检查
  return fsp.fileExists(CHANGLOG_FILE)
    .then(function(exists) {
      if (!exists) {
        return fsp.deleteFile(JSON_FILE);
      }
    })
    .then(function() {
      try {
        data = require(JSON_FILE);
      } catch (err) {
        data = {
          lastRev: 1, // 最后更新的修订版本。已知 r1 没有 current.txt, 跳过。
          revs: [] // 有 current.txt 的修订版本
        };
      }

      if (lastRev === data.lastRev) {
        console.log('no update');
        process.exit(0);
      }
    })
    .then(function() {
      return checkout(lastRev);
    })
    .then(function(rev) {
      if (rev === data.lastRev) {
        console.log('no update');
        process.exit(0);
      } else {
        let n = data.lastRev + 1;
        data.lastRev = rev;
        return checkout(n, rev);
      }
    })
    .then(function(revs) {
      return combine(revs);
    })
    .then(function() {
      return fsp.writeFileAsync(JSON_FILE, JSON.stringify(data));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
}

function combine(revs) {
  return fsp.readFileAsync(CHANGLOG_FILE, 'utf8').then(parse)
    .catch(function() {
      // CHANGLOG_FILE 不存在，则重新解析已有的 txt
      revs.redo = true;
    })
    .then(function(obj) {
      if (revs.redo) {
        obj = {};
        revs = data.revs.concat(revs);
      }

      return Promise.all(revs.map(parse)).then(function(results) {
        results.forEach(function(x) {
          objectAssign(obj, x);
        });
        return obj;
      });
    })
    .then(function(obj) {
      data.revs = data.revs.concat(revs);
      var list = [];
      data.revs.forEach(function(x) {
        // 忽略没有内容的记录
        if (obj[x]) {
          list.push(x + rn(2) + obj[x]);
        }
      });
      // 倒序合并
      return fsp.writeFileAsync(CHANGLOG_FILE, list.reverse().join(rn(4)));
    });
}

function rn(n) {
  return new Array(n + 1).join('\r\n');
}
