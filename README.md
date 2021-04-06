## 开发步骤
npm init -y

git init 初始化

lerna init  lerna初始化

lerna create core    创建package 


lerna add @comm-cli-dev/utils  packages/core    添加到指定的packages要下载哪个依赖   第一个参数要下载的依赖, 要下载到指定包的路径
 
lerna bootstrap   回复 依赖包 (node_modules)

leran link   我的理解 在dependencies{}写依赖包 然后就可以实现软连接

lerna run --scope @comm-cli-dev/core test  启动指定包的命令  相当于(npm run test)

lerna exec   --scope @comm-cli-dev/utils  -- rm -rf   node-modules


lerna version //不是很清楚用法

lerna  changed 查看package 是否有改变

lerna  diff // 不是很清楚用法


