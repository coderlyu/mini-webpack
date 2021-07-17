const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')
const { SyncHook } = require('tapable')

module.exports = class Compiler {
  constructor(config) {
    this.config = config
    this.entry = config.entry || './src/index.js'
    this.root = config.root || process.cwd()
    this.rules = config.module.rules || []
    this.output = config.output || { filename: 'bundle.js', path: path.resolve(this.root, 'dist') }
    this.modules = {}
    this.cacheLoaders = {}

    this.hooks = {
      entryOption: new SyncHook(),
      run: new SyncHook(),
      compile: new SyncHook(),
      make: new SyncHook(),
      emit: new SyncHook(),
      done: new SyncHook(),
    }

    if (Array.isArray(config.plugins)) {
      config.plugins.forEach(plusin => plusin.apply(this))
    }
    this.hooks.entryOption.call()
  }

  getSource (filePath) {
    return fs.readFileSync(filePath, 'utf-8')
  }

  start () {
    this.hooks.run.call()
    this.depAnalyse(this.entry)
  }

  depAnalyse (entry) {
    let filePath = path.resolve(this.root, entry)

    let source = this.getSource(filePath)
    let ast = parser.parse(source)
    let root = this.root
    let dependenes = []
    traverse(ast, {
      CallExpression (p) {
        const { name } = p.node.callee
        if (name === 'require') {
          let oldPath = p.node.arguments[0].value
          oldPath = `./${path.relative(root, path.resolve(path.dirname(path.resolve(root, entry)), oldPath))}`.replace(/\\+/g, '/')
          dependenes.push(oldPath)
          p.node.arguments[0].value = oldPath
          p.node.callee.name = '__webpack_require__'
        }
      }
    })
    dependenes.forEach((path) => {
      this.depAnalyse(path)
    })
    let code = generator(ast).code
    this.modules[entry] = this.loadAndRunLoaders(code, filePath)
    this.hooks.compile.call()
    this.emit()
  }

  emit () {
    this.hooks.emit.call()
    let template = fs.readFileSync(path.resolve(__dirname, '../template/index.ejs'), 'utf-8')
    let result = ejs.render(template, {
      modules: this.modules,
      entryPath: this.entry
    })
    fs.writeFileSync(path.join(this.output.path, this.output.filename), result)
    this.hooks.done.call()
  }

  loadAndRunLoaders (code, filePath) {
    for (let i = 0; i < this.rules.length; i++) {
      let { test, use } = this.rules[i]
      if (test.test(filePath)) {
        if (Array.isArray(use)) {
          for (let j = use.length - 1; j >= 0; j--) {
            let loader = use[j]
            code = this.cacheLoader(loader, code)
          }
        } else if (typeof use === 'string') {
          code = this.cacheLoader(use, code)
        } else if (typeof use === 'object') {
          code = this.cacheLoader(use.loader, code, use.options)
        }
      }
    }
    return code
  }
  cacheLoader (loader, code, options = undefined) {
    if (!this.cacheLoaders[loader]) {
      this.cacheLoaders[loader] = require(path.resolve(this.root, loader))
    }
    code = this.cacheLoaders[loader].call({ query: options }, code)
    return code
  }
}