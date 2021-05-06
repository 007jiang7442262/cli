'use strict';
const Command = require('@comm-cli-dev/command');
const log = require('@comm-cli-dev/log');
const inquirer = require('inquirer');
const child_process = require('child_process')
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const semver = require('semver');
const request = require('@comm-cli-dev/request');
const Packages = require('@comm-cli-dev/package');
const utils = require('@comm-cli-dev/utils');
const kebabcase = require('kebabcase'); // 解决驼峰的命名规则
const glob = require('glob');
const ejs = require('ejs');
const os = require('os')
const { throws } = require('assert');
var Spinner = require('cli-spinner').Spinner;



const COMPONENT_TYPE = 1;
const PROJECT_TYPE = 2;

const ejsFile = ['package.json', 'index.html']

class InitCommand extends Command {

    init() {
        this.projectName = this._argv[0] || '';
        this.force = this._argv[this._argv.length - 1].force;
        log.verbose('this.projectName =', this.projectName);
        log.verbose('this.force =', this.force);
    }

    async exec() {
        try {
            // 通过项目模本API获取项目模本信息
            //1.1 通过egg.js搭建一套后端系统
            //1.2 通过npm 存储项目模板
            //1.3 将项目模本信息放在mongodb数据库中
            //1.4 通过egg.js获取mongodb中的数据,

            const result = await this.getTemplate();
            if (result && result.length > 0) {
                await this.prepare();
                await this.createDir();
                const template = await this.createProjectTemplate(result);
                const obj = result.find(item => (item.npm_name === template))
                await this.downloadTemplate(obj);
                await this.installTemplate(obj);
            } else {
                throw new Error('没有找到模板');
            }

        } catch (error) {
            console.log('error =', error)
        }
    }


    async getTemplate() {
        const result = await request.get('/template');
        if (result.ret === 0) {
            return result.result;
        } else {
            throw new Error('调用模板接口失败')
        }
    }

    async prepare() {
        //判断当前目录是否为空
        const localPath = process.cwd();
        let isEmptyFile = {};
        //2. 是否启动强势更新
        if (this.ifDirIsEmpty(localPath)) {
            if (!this.force) {
                isEmptyFile = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'isEmptyFile',
                        message: '当前目录不是空目录, 是否继续'
                    }
                ]);
            }
            if (isEmptyFile.isEmptyFile || this.force) {
                const deleteFile = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'deleteFile',
                        message: '你确认删除以下文件'
                    }
                ]);
                if (deleteFile.deleteFile) {
                    fse.emptyDirSync(localPath);
                }
            }
        }

        //3. 选择创建目录和组件

        //4. 获取项目的基本信息
    }


    async createDir() {
        let tag = false;
        var reg = new RegExp('[\\\\/:*?\"<>|]');
        if (reg.test(this.projectName)) {
            tag = true;
        }
        const ObjectName = await inquirer.prompt([
            {
                type: 'list',
                name: 'objectName',
                message: '请选择创建类型',
                choices: [
                    { name: '项目', value: PROJECT_TYPE },
                    { name: '组件', value: COMPONENT_TYPE }
                ]
            },
        ])
        // 模板
        if (ObjectName.objectName === PROJECT_TYPE) {
            const commandArray = [
                {
                    type: 'input',
                    name: 'version',
                    default: '1.0.0',
                    message: '请输入版本号',
                    validate: function (v) {
                        var done = this.async();
                        if (!semver.valid(v)) {
                            done('请输入正确的版本号格式');
                            return;
                        } else {
                            done(null, true);
                        }
                    }
                }
            ]
            if (tag) {
                commandArray.unshift({
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    validate: function (v) {
                        var done = this.async();
                        if (!v) {
                            done('输入项目名称');
                            return;
                        } else if(reg.test(v)) {
                            done('项目名称不能包括特殊字符');
                        } else {
                            done(null, true);
                        }
                    }
                })
            } 
            const createProject = await inquirer.prompt(commandArray)
            if(!tag) {
                createProject.projectName = this.projectName;
            }
            this.projectInfo = createProject;
        } else if (ObjectName.objectName === COMPONENT_TYPE) { //组件
            const projectObj = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'component_type',
                    message: '请输入项目名称',
                    validate: function (v) {
                        var done = this.async();
                        if (!v) {
                            done('输入项目名称');
                            return;
                        } else {
                            done(null, true);
                        }
                    }
                }
            ])
        }
    }

    async ejcRender(pathFile) {
        const projectInfo = this.projectInfo;
        projectInfo.projectName = kebabcase(projectInfo.projectName)// .replace(/^-/);
        glob('**/**', { cwd: pathFile }, function (error, fileArray) {
            console.log('fileArray =', fileArray);
            if (error) throw new Error(error);
            const filterPath = fileArray.filter(p => ejsFile.includes(p));
            Promise.all(filterPath.map(item => {
                return new Promise(function (resolve, reject) {
                    const parsePath = path.resolve(pathFile, item);
                    ejs.renderFile(parsePath, projectInfo, { ignore: ['src', 'config'] }, function (err, str) {
                        if (err) return reject(err);
                        fse.writeFileSync(parsePath, str);
                        resolve(1);
                    });
                })
            }))
        })
    }

    async installTemplate(obj) {
        const cmdInstall = await inquirer.prompt([
            {
                type: 'list',
                name: 'cmd',
                message: '请选择命令下载依赖',
                choices: [
                    { name: 'npm', value: 'npm' },
                    { name: 'cnpm', value: 'cnpm' }
                ]
            },
        ])
        const currentPath = this.newPackage.filePath;
        const localPath = process.cwd();
        const allPath = path.resolve(currentPath, 'template');
        const deleteFile = path.resolve(localPath, obj.npm_name);
        const spinner = new Spinner('开始安装依赖');
        spinner.setSpinnerString('|/-\\');
        spinner.start();
        console.log('this.projectInfo =', );
        const proInfo = this.projectInfo;
        try {
            const pathTemplate = path.resolve(localPath, proInfo.projectName);
            fse.ensureDirSync(pathTemplate);
            fse.copySync(allPath, pathTemplate);
            fse.removeSync(deleteFile);
            await this.ejcRender(pathTemplate);
            const child = utils.spawn(cmdInstall.cmd, ['install'], {
                cwd: pathTemplate,
                stdio: 'inherit'
            })

            child.on('error', e => {
                log.error(e);
                process.exit(1);
            })
            child.on('exit', e => {
                log.success('依赖安装成功');
                process.exit(0);
            })
            spinner.stop(true);
        } catch (error) {
            console.log('error =', error);
            throw new Error('安装依赖失败');
        } finally {
            spinner.stop(true);
        }

        ///Users/jiangchao/Desktop/test/react-template-vw/_react-template-vw@1.0.0@react-template-vw/template/react-template-vw/_react-template-vw@1.0.0@react-template-vw
    }


    async downloadTemplate(obj) {
        const localPath = process.cwd();
        const targetPath = path.resolve(localPath, obj.npm_name);
        const newPackage = new Packages({
            targetPath: targetPath,
            storeDir: targetPath,
            packageName: obj.npm_name,
            packageVersion: obj.version
        });
        if (! await newPackage.exists()) {
            // const spinner = new Spinner('开始下载');
            // spinner.setSpinnerString('|/-\\');
            // spinner.start();
            try {
                await newPackage.install();
                // spinner.stop(true);
            } catch (error) {
                console.log('error =', error);
            } finally {
                // spinner.stop(true);
            }
        } else {
            // const spinner = new Spinner('开始更新');
            // spinner.setSpinnerString('|/-\\');
            // spinner.start();
            try {
                await newPackage.update();
                // spinner.stop(true);
            } catch (error) {
                // console.log('error =', error);
            } finally {
                // spinner.stop(true);
            }
        }

        this.newPackage = newPackage;
    }

    async createProjectTemplate(list) {
        const currentTemplate = await inquirer.prompt([
            {
                type: 'list',
                name: 'projectTemplate',
                message: '请选择项目模板',
                choices: list.map(item => ({ name: item.name, value: item.npm_name }))
            }
        ])
        return currentTemplate.projectTemplate;
    }

    ifDirIsEmpty(localPath) {
        const fileList = fs.readdirSync(localPath);
        const tempList = fileList.filter((item) => {
            return !item.startsWith('.') && ['node_modules'].indexOf(item) < 0
        })
        return tempList && tempList.length > 0;
    }
}



function init(array) {
    new InitCommand(array);
}


module.exports = init;

// comm-cli-dev init projectName     --targetPage /Users/jiangchao/Documents/code/2lerna/comm-cli-dev/commands/init  --debug  --force
