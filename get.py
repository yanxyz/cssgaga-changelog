#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Ivan Yan 2013-12-20
# 获取并整合 CssGaGa 更新日志
#
# 2014-04-10
# 改为 python 3.4
#

from __future__ import unicode_literals

import os
import sys
import subprocess
import re
import codecs
import json
import argparse

changelog = 'CHANGELOG.txt' # 整合的日志
currenttxt = 'current.txt' # svn 日志
logdir = './log' # log 文件放置目录

if not os.path.exists(logdir):
	os.mkdir(logdir)

logjson = os.path.join(logdir, 'log.json')

def sav_config():
	open(logjson, 'w').write(json.dumps(log))

if not os.path.exists(logjson):
	log = {
		'r0': 0, # 远程的 revision
		'r': 0, # 已获取的 revision
		'n': 0, # 已处理的 revision
		'a': [] # 有 current.txt 的 revision
	}
	sav_config()
else:
	log = json.load(open(logjson, 'r'))


# 获取版本
# 版本在 current.txt 中， 只签出此文件

def check():
	'''检查 revision

	注意检查更新后没有自动获取更新
	'''
	output = subprocess.check_output(["svn", "up", currenttxt]).decode("latin")
	print(output)
	m = re.search(r'\d+', output)
	remote_r = int(m.group(0))
	tip = True

	if remote_r == log['r0']:
		if log['r'] == log['r0']:
			tip = False
			print('已经是最新的')
	else:
		log['r0'] = remote_r
		sav_config()
		print('有更新')

	if tip:
		print('使用参数 -u 来获取更新')

def up(num):
	'''获取指定的 revision

	更新如果包含 current.txt 会提示 Updated to revision xxx.
	有的更新没有，比如 r1 只是初始化目录，这时跳过
	https://code.google.com/p/cssgaga/source/list?num=25&start=6
	'''
	str_num = str(num)
	print('revision ' + str_num + " ..." )
	output = subprocess.check_output(["svn", "up", "-r" + str_num, currenttxt]).decode("latin")
	search = 'Updated to revision ' + str_num
	if search in output:
		logfile = os.path.join(logdir, str_num + '.txt')
		# 如果已存在则删除，保证可以重复运行
		if os.path.exists(logfile):
			os.remove(logfile)
		os.rename(currenttxt, logfile)
		if not num in log['a']:
			log['a'].append(num)
		print('done')
	else:
		print('skip')

def upall():
	'''获取全部 revision'''

	if log['r'] < log['r0']:
		print('开始获取日志...')
		for i in range(log['r'] + 1, log['r0'] + 1):
			up(i)
		log['r'] = log['r0']
		sav_config()
		print('已获取全部日志')
	else:
		if log['r0'] == 0:
			print('使用参数 -c 检查更新')
		else:
			print('已经是最新的')

# 按序从日志文件中提取版本
# 使用 map 结构： key 为版本号， value 为此版本号的更新信息
# 不同日志文件之间重复的版本，取后面的

def split_log(logfile, d = {}):
	# s = open(logfile, 'r').read()
	# 这里假定只有 gbk 与 utf-8 两种编码， 可能出错
	try:
		s = open(logfile, encoding='gbk').read()
	except UnicodeDecodeError:
		s = open(logfile, encoding='utf-8-sig').read()

	p = re.compile(r'^[ \t]*(\d+)[ \t]*\n', re.M)
	vers = p.findall(s)
	contents = p.split(s)
	for v in vers:
		j = contents.index(v)
		k = int(v)
		d[k] = contents[j+1].strip()
	return d

def save(d):
	content = ''
	keys = sorted(d)
	for k in keys:
		content = str(k) + '\n' + d[k] + '\n\n' + content
	open(changelog, mode='w', encoding='utf-8').write(content)

def merge_all():
	'''重新合并本地所有日志'''

	print('开始合并...')
	d = {}

	for i in range(len(log['a'])):
		logfile = os.path.join(logdir, str(log['a'][i]) + '.txt')
		d = split_log(logfile, d)

	save(d)
	print('合并完成')

def merge_up():
	'''增量合并'''

	if log['n'] < log['r']:
		print('开始合并...')
		d = split_log(changelog) if os.path.exists(changelog) else {}
		for i in range(log['n'] + 1, log['r'] +1):
			if i in log['a']:
				logfile = os.path.join(logdir, str(i) + '.txt')
				d = split_log(logfile, d)
		save(d)
		log['n'] = log['r']
		sav_config()
		print('合并完成')
	else:
		if log['r'] == 0:
			print('使用参数 -c 检查更新')
		else:
			print('没有新内容供合并')

def test():
	# content = open('log/119.txt', 'r').read()
	content = open('log/5.txt', 'r').read()
	# 处理 utf-8 bom
	# http://stackoverflow.com/questions/17912307/u-ufeff-in-python-string
	if content.startswith(codecs.BOM_UTF8):
		content = content.decode('utf-8-sig')

	p = re.compile(r'^[ \t]*(\d+)[ \t]*$', re.M)
	vers = p.findall(content)
	print(vers)
	contents = p.split(content)
	print(contents)

def test_save():
	log['a'] = [116, 117, 118, 119]
	merge_all()

if __name__ == '__main__':
	# test()

	parser = argparse.ArgumentParser(prog='getlog', description='获取并整合 CssGaga 更新日志')
	parser.add_argument('-c', action='store_true', help="检查更新")
	parser.add_argument('-u', action='store_true', help="获取检查到的更新")
	parser.add_argument('-a', action='store_true', help="重新合并本地所有更新日志")

	args = parser.parse_args()

	# 只支持一个选项
	if args.c:
		check()
	elif args.u:
		upall()
		merge_up()
	elif args.a:
		merge_all()
	else:
		parser.parse_args('-h'.split())
