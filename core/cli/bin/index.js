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
const exec = require('../../exec/lib/index')

const program = new commander.Command() //这是实例化

let homeDir = '';


async function core(val) {
  try {
    await prepare();
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
  .option('-d --debug', '开启调试模式', false) //全局选项 不管输入任何命令 都可以带上这个参数
  .option('-pt --targetPage <targetPage>', "是否指定本地调试文件", "")  // 全局选项 不管输入任何命令 都可以带上这个参数

 program.on('option:debug', function() {
    const debug = program._optionValues.debug;
    if(debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose('开启debug');
  }) 


  program.on('option:targetPage', function() {
    //const targetPage = program._optionValues.targetPage;
    process.env.CLI_TARGET_PAGE = program._optionValues.targetPage;
  })


  program
    .command("init [projectName]") // comm-cli-dev  init test-project --force
    .option("-f --force")
    .action(exec.exec)

  // 对未知的命令提示 先把上面的arguments注释了
  program.on('command:*', function(array) {
    console.error('未知命令 :', array[0]);
    const allCommand = program.commands.map(item => item.name());
    console.log('可用命令:', allCommand.join(','))
  })  

  if(process.argv.length < 3) {
    // program.outputHelp();
    console.log();
  }

  program.parse(process.argv);
}


async function prepare() {
  // checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  // await checkGlobalUpate();
}
 
async function checkGlobalUpate() {
  // 1.获取当前的版本号, 和模块名
  const packVersion = pak.version;
  const packName = pak.name;
  // 2.调用npm上面的api获得这个模块的所有的版本
  const { checkVersionUpdate } = require('@comm-cli-dev/get-npm-info');
  const versions = await checkVersionUpdate(packVersion, packName);
  if(versions && versions.length > 0) {
    log.warn('更新提示:', `已经有最新版本上线, 请手动更新到${versions[0]}, 当前版本是${packVersion}更新命令 npm -g i ${packName}`);
  }
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(homeDir, '.env');
  if (pathExists.sync(dotenvPath)) {
    dotenv.config({path: dotenvPath}); // 读取指定路径下的环境变量
    // console.log('config =', config); // 输出配置文件的环境变量
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const config = {
    home: homeDir
  };
  if(process.env.CLI_HOME) { // 如果配置文件里面有这个配置项 就有这个
  } else {
    config.cliHome = path.join(homeDir, consts.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = process.env.CLI_HOME;
} 

function checkRoot() {
  //用root权限启动时, 自动降级, 
  const rootCheck = require('root-check');
  // process.geteuid() 获得当前权限的代号 root的代码是0,   sudo 启动就是用root权限启动的
  // rootCheck root启动自动降级
  rootCheck()
  // console.log(process.geteuid())
}



async function  checkUserHome() {
  const usersHome = os.homedir(); //  /Users/jiangchao
  homeDir = usersHome;
  const dirStatus = await pathExists(usersHome);
  if(!usersHome || !dirStatus) {
    throw new Error(colors.red(`当前登录用户主目录不存在!`))
  }
}


// function checkInputArges() {
//   const mimimist = require('minimist'); // 解析命令参数
//   const args = mimimist(process.argv.slice(2));
//   // checkArgs(args);
// }

//function checkArgs(args) {
//  if(args.debug) {
//    process.env.LOG_LEVEL = 'verbose';
//  } else {
//    process.env.LOG_LEVEL = 'info';
//  }
//  //设置log打印, 先要设置log.level 类型
//  //log.silly(prefix, message, ...)
//  //log.verbose(prefix, message, ...)
//  //log.info(prefix, message, ...)
//  //log.http(prefix, message, ...)
//  //log.warn(prefix, message, ...)
//  //log.error(prefix, message, ...)
//  log.level = process.env.LOG_LEVEL;
//}