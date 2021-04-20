'use strict';
const log = require('npmlog');

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
// log.heading = "command"; // 前缀字符串

// log.headingStyle = {fg: 'red', bg: 'black'}; //前缀的样式
log.addLevel('success', 2000, {fg: 'green', bold: true});

module.exports = log;
