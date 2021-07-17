# 使用

* `npm install` 或 `yarn`
* `npm link`，之后就将 `acli` 命令注册到了全局

1. 准备一个新项目，将原来的 `webpack` 命令改成 `acli` 就能完成 `mini-webpack` 的构建功能
2. 需提供一个 `webpack.config.js` 配置文件
3. `acli` 默认读取的是 `process.cwd()` 下的 `webpack.config.js` 配置文件