'use strict';
const Package = require('@comm-cli-dev/package');
const log = require('@comm-cli-dev/log');
const path = require('path');
const cp = require('child_process');
const utils = require('@comm-cli-dev/utils');
const SETTINGS = {
  init: 'comm-cli-dev'
}

const CACHE_DIR = 'dependencies'
// 
// comm-cli-dev init projectName  --debug --force  --targetPage /Users/jiangchao/Documents/code/2lerna/comm-cli-dev/commands/init
// init:初始化项目的命令 
// projectName: 项目名称
// --debug 开启debug模式 用于打印日子
// --force 强制创建文件
// --targetPage 指定用哪个函数出做初始化 这样的话适配性高, 只要输入文件就调用哪个函数
// 如果不传 --targetPage 就去找该名单的默认包  SETTINGS是默认包的映射的包名表
async function exec() {
  let targetPath = process.env.CLI_TARGET_PAGE;
  let storeDir = '';
  let pkg = null;
  const homePath = process.env.CLI_HOME_PATH;
  const cmdObj = arguments[arguments.length - 1];
  const commandName = cmdObj.name();
  const packageName = SETTINGS[commandName];
  const packageVersion = 'latest';
  // log.level = process.env.LOG_LEVEL;
  log.verbose('targetPath ', targetPath);
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storeDir
    });
    if (await pkg.exists()) {
      log.verbose('该路径存在');
      pkg.update();
    } else {
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rottFile = pkg.getRootFilePath();
  if (rottFile) {
    try {
      let array = Array.from(arguments);
      const tempObj = array[array.length - 1];
      const o = Object.create(null);
      Object.keys(tempObj).forEach(key => {
        if (tempObj.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = tempObj[key]
        }
      })
      array[array.length - 1] = o;
      let code = `require('${rottFile}').call(null, ${JSON.stringify(array)})`;
      const child = utils.spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit' // 星期4/6-3
      })
      child.on('error', e => {
        log.error(e);
        process.exit(1);
      })
      child.on('exit', e => {
        log.verbose('执行命令成功', e);
        process.exit(0);
      })
    } catch (error) {
      console.error(error);
    }
  } else {
    console.log('该包不存在 ')
  }
  // log.verbose('rottFile =', rottFile);  
}


function spawn(command, args, option) {
  // window 调动命令  cp.spawn('cmd', ['/c', 'node', '-e', code])
  // mac cp.spawn('node', ['-e', code])
  const win32 = process.platform === 'win32'; // 说明是window 系统
  const cmd = win32 ? 'cmd' : command;
  const cmdArays = win32 ? ['/c'].concat(command, args) : args;
  return cp.spawn(cmd, cmdArays, option || {});
}

module.exports = {
  exec,
  spawn
};
