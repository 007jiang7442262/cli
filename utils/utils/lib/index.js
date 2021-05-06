

'use strict';
const cp = require('child_process');


function checkType(param, type) {
    const currentType  = type || '[object Object]'
   return Object.prototype.toString.call(param) === currentType;
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
    checkType,
    spawn
};
