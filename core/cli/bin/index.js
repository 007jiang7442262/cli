#!/usr/bin/env node

module.exports = core;
const path = require('path');
const pak = require('../package.json')
const consts = require('./const');
const colors = require('colors/safe'); // 在控制台上指定输出文字的颜色
const semver = require('semver'); //版本对不
const commander = require('commander');
const pathExists = require('path-exists');//检查文件路径是否存在
const os = require('os'); 
const fs = require('fs');
const log = require('@comm-cli-dev/log');

const program = new commander.Command() //这是实例化

let homeDir = '';


async function core(val) {
  try {
    checkInputArges();
    log.verbose('debug', '开始 debug log');
    // 检查包的版本号
    checkPkgVersion();
    // 检查node的版本号
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpate();
    registerCommand();
  } catch (e) {
    console.log(e.message)
  }
}


//注册命令
function registerCommand() {
  program
  .name(Object.keys(pak.bin)[0])
  .usage('<command> [option]')
  .version(pak.version)
  .option('-d --debug', '开启调试模式', false);
  program.parse(process.argv);
}

async function checkGlobalUpate() {
  // 1.获取当前的版本号, 和模块名
  const packVersion = pak.version;
  const packName = pak.name;
  // 2.调用npm上面的api获得这个模块的所有的版本
  const { checkVersionUpdate } = require('@comm-cli-dev/get-npm-info');
  const versions = await checkVersionUpdate(packVersion, packName);
  log.verbose('versions =', versions);
  if(versions && versions.length > 0) {
    log.warn('更新提示:', `已经有最新版本上线, 请手动更新到${versions[0]}, 当前版本是${packVersion}更新命令 npm -g i ${packName}`);
  }

}


function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(homeDir, '.env');
  if (pathExists.sync(dotenvPath)) {
    const config = dotenv.config({path: dotenvPath}); // 读取指定路径下的环境变量
    console.log('config =', config); // 输出配置文件的环境变量
  }
  createDefaultConfig();
  // console.log('process.env.CLI_HOME_PATH =', process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const config = {
    home: homeDir
  };
  if(process.env.CLI_HOME) { // 如果配置文件里面有这个配置项 就有这个
    log.verbose('在文件读取环境变量 =', process.env.CLI_HOME)
    config.cliHome = path.join(homeDir, process.env.CLI_HOME);
  } else {
    config.cliHome = path.join(homeDir, consts.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = config.cliHome;
}

function checkInputArges() {
  const mimimist = require('minimist'); // 解析命令参数
  const args = mimimist(process.argv.slice(2));
  checkArgs(args);
}

function checkArgs(args) {
  if(args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  //设置log打印, 先要设置log.level 类型
  //log.silly(prefix, message, ...)
  //log.verbose(prefix, message, ...)
  //log.info(prefix, message, ...)
  //log.http(prefix, message, ...)
  //log.warn(prefix, message, ...)
  //log.error(prefix, message, ...)
  log.level = process.env.LOG_LEVEL;
}

function checkRoot() {
  //用root权限启动时, 自动降级, 
  const rootCheck = require('root-check');
  // process.geteuid() 获得当前权限的代号 root的代码是0,   sudo 启动就是用root权限启动的
  // rootCheck root启动自动降级
  rootCheck()
  console.log(process.geteuid())
}

//当前版本号
function checkPkgVersion() {
  console.log(pak.version)
}

//检查node版本号
function checkNodeVersion() {
  console.log('version',process.version);
  const currenntVersion = process.version;
  const lowestVersion = consts.NODE_VERSION;
  // 小于当前版本检查
  if (!semver.gte(currenntVersion, lowestVersion)) {
    throw new Error(colors.red(`comm-cli-dev 需要安装 v${lowestVersion}以上版本node `))
  }
}

async function  checkUserHome() {
  const usersHome = os.homedir(); //  /Users/jiangchao
  homeDir = usersHome;
  const dirStatus = await pathExists(usersHome);
  if(!usersHome || !dirStatus) {
    throw new Error(colors.red(`当前登录用户主目录不存在!`))
  }
}