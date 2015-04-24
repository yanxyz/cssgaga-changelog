# CssGaga Changelog

[CssGaga](http://www.99css.com/cssgaga/) 没有完整的更新日志，只是在更新的时候提示最近几次的更新日志，时间一长就不清楚有什么变动，于是我写了个脚本来获取完整的更新日志， 结果见 CHANGELOG.txt。

CssGaga 放在 [Google Code](http://cssgaga.googlecode.com) 上，[提交记录](https://code.google.com/p/cssgaga/source/list)。不过 [Google Code 快关闭了](http://google-opensource.blogspot.com/2015/03/farewell-to-google-code.html)。因为我也更新一下这个项目。之前是用 Python 写的，现在改用 Node.js 实现。

CssGaga 现在放在 [Github](https://github.com/ytzong/CssGaga) 上，[提交记录](https://github.com/ytzong/CssGaga/commits/gh-pages)。不过这里只抓取在 Google Code 上的更新记录。

## 使用说明

因为众所周知的原因，需要代理访问 Google。

事先安装好:

- Node.js, 这里用的是 io.js。
- Git 客户端，这里用的是 MsysGit。
- SVN 客户端, 这里用的是 TortoiseSVN。

打开 Git Bash，运行：

```bash
# 检查 svn 是否可用
svn --help
git clone https://github.com/yanxyz/cssgaga-changelog.git
cd cssgaga-changelog
svn checkout http://cssgaga.googlecode.com/svn/trunk/upload --depth empty cssgaga
npm i
node index.js -h
```

## 版权

MIT
