'use strict';

const semver = require('semver');
const colors = require('colors');
const NODE_VERSION = "12.0.0";
class Command {
    constructor(argv) {
        if (!argv) {
            throw new Error('参数不能为空')
        }
        if (!Array.isArray(argv)) {
            throw new Error('参数为数组类型');
        }
        if (argv.length < 1) {
            throw new Error('参数列表为空');
        }
        this._argv = argv;
        const runner = new Promise((resolve, reject) => {
            let child = Promise.resolve();
            child
                .then(() => {
                    this.checkNodeVersion();
                })
                .then(() => {
                    this.initArgs()
                })
                .then(() => {
                    this.init()
                })
                .then(() => {
                    this.exec();
                })
                .catch(error => {
                    console.error(error) 
                })
        })
    }

    initArgs() {
        this._cmd = this._argv[this._argv.length - 1];
        this._argv = this._argv.slice(0, this._argv.length - 1);
    }


    //检查node版本号
    checkNodeVersion() {
        const currenntVersion = process.version;
        const lowestVersion = NODE_VERSION;
        // 小于当前版本检查
        if (!semver.gte(currenntVersion, lowestVersion)) {
            throw new Error(colors.red(`comm-cli-dev 需要安装 v${lowestVersion}以上版本node `))
        }
    }

    init() {
        throw new Error('必须实现init');
    }

    exec() {
        throw new Error('必须实现exec');
    }
}

module.exports = Command;

