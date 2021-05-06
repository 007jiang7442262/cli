#!/usr/bin/env node

'use strict';
const importLocal = require('import-local');
const log = require('@comm-cli-dev/log');

if (importLocal(__filename)) {
    require('npmlog').info('cli','使用本地脚手架工具')
} else {
    require('../bin/index')(process.argv.slice(2))
}