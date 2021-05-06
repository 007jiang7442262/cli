'use strict';
const utils = require('@comm-cli-dev/utils');
const npminstall = require('npminstall');
const path = require('path');
const { getDefaultRegistry, getNpmLatestVersion } = require('@comm-cli-dev/get-npm-info');
const { formatPath } = require('@comm-cli-dev/format-path');
const pathExists = require('path-exists').sync;
class Package {

  constructor(options) {
    if (!options) {
      throw new Error(`package的类参数不能为空`)
    }
    if (!utils.checkType(options)) {
      throw new Error('package的类参数类型不对')
    }
    //package目标路径
    this.targetPath = options.targetPath;
    //package缓存路径 
    this.storeDir = options.storeDir;
    //package name
    this.packageName = options.packageName;
    // package version
    this.packageVersion = options.packageVersion;
    //前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '-');
  }

  // 找最新的包的版本
  async prepare(tag) {
    if (this.packageVersion === 'latest' || tag === 1) { //获得最新包
      const version = await getNpmLatestVersion(this.packageName);
      if (version) {
        //获得最新的版本号
        this.packageVersion = version;
      } else {
        throw new Error(`该包不存在`)
      }
    }
  }


  //判断当前的package是否存在
  async exists() {
    await this.prepare();
    if (this.storeDir) {
      const packagePath = this.cacheFilePath();
      return pathExists(packagePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  get filePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }

  // 安装package
  async install() {
    // await this.prepare();
    // console.log('开始下载')
    // console.log(this.packageVersion)
    await npminstall({
      root: this.targetPath, //下载的文件目录
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion
      }],
    })
  }

  getLatestCacheFilePath(newCacheFilePathPrefix, packageVersion) {
    return path.resolve(this.storeDir, `_${newCacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
  }


  // 更新package
  async update() {
    // await this.prepare(1); 
    // 获得最新的版本号
    const version = await getNpmLatestVersion(this.packageName);
    if (version) {
      //1.获得最新的npm包的版本号
      const newCacheFilePathPrefix = this.packageName.replace('/', '-');
      //2.检查最新的版本号是否存在
      const latestFilePath = this.getLatestCacheFilePath(newCacheFilePathPrefix, version);
      //3.如果不存在, 就更新该包
      if (!pathExists(latestFilePath)) {
        await npminstall({
          root: this.targetPath, //下载的文件目录
          storeDir: this.storeDir,
          registry: getDefaultRegistry(),
          pkgs: [{
            name: this.packageName,
            version: version
          }],
        })
        this.packageVersion = version;
      }
    } else {
      throw new Error(`更新包失败, 原因是获得版本号失败`);
    }
  }

  getRootFilePath() {
    function _getRootFile(dir) {
      const getRootPath = path.resolve(dir, 'package.json');
      if (pathExists(getRootPath)) {
        const packageFile = require(getRootPath);
        if (packageFile && packageFile.main) {
          return formatPath(path.resolve(dir, packageFile.main))
        }
      }
      return null;
    }
    if (this.storeDir) {
     return _getRootFile(this.cacheFilePath())
    } else {
     return _getRootFile(this.targetPath);
    }

  }
}

module.exports = Package;


