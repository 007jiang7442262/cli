##
在没有提交包的时候, 所有的  "version": "1.0.0", 都是这个
## 开发步骤
npm init -y

git init 初始化

lerna init  lerna初始化

lerna create core path   创建package     
// lerna creare get-npm-info utils/get-npm-info
// lerna create  get-npm-info /utils/

lerna add @comm-cli-dev/utils  packages/core    添加到指定的packages要下载哪个依赖   第一个参数要下载的依赖, 要下载到指定包的路径
 
lerna bootstrap   回复 依赖包 (node_modules)

leran link   我的理解 在dependencies{}写依赖包 然后就可以实现软连接

lerna run --scope @comm-cli-dev/core test  启动指定包的命令  相当于(npm run test)

lerna exec   --scope @comm-cli-dev/utils  -- rm -rf   node-modules


lerna version //修改包的版本号

lerna  changed 查看package 是否有改变

lerna  diff // 查看变更





## git 
git remote add origin git@gitee.com:jc7442262/comm-cli-dev.git  // 第二段 3-6 3:50



## 发布流程
如果有更新 
lerna  diff // 查看变更
git add .
git commit -m ""
git push
git config  user.name 007jiang7442262 
git config  user.email 2579375393@qq.com
lerna publish //提交更新包
lerna version //修改包的版本号

