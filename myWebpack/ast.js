const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const types = require("@babel/types")
const generate = require('@babel/generator').default
const path = require('path')
const uuid = require('uuid')
const config = require('../webpack.config')

const EXPORT_DEFAULT_FUN = `
__webpack_require__.d(__webpack_exports__, {
   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});\n
`

const ESMODULE_TAG_FUN = `
__webpack_require__.r(__webpack_exports__);\n
`

function parseFile (file) {
  const fileContent = fs.readFileSync(file, 'utf-8')

  const ast = parser.parse(fileContent, { sourceType: 'module' })
  let importFilePaths = []
  let importDefaultNames = []
  let count = 0
  let hasExport = false
  traverse(ast, {
    ImportDeclaration (p) {
      let importPath = p.node.source.value
      let importFile = path.join(path.dirname(file), importPath)

      importFilePath = `./${importFile}.js`

      importFilePaths.push(importFilePath) // 存储 当前文件引入的 所有其它文件

      let localName = generatelocalName(importFile)
      let covertName = `${localName}__WEBPACK_IMPORTED_MODULE_${count}__`

      let specifiers = p.node.specifiers
      specifiers.forEach((specifier) => {
        const name = specifier.local.name
        const currentBinding = p.scope.getBinding(name)
        currentBinding.referencePaths.forEach((referencePath) => {
          if (referencePath.type === 'Identifier') {
            let defaultName = `${covertName}.${name}`
            if (!Object.prototype.hasOwnProperty.call(specifier, 'imported')) {
              defaultName = `${covertName}.default`
              referencePath.replaceWith(types.identifier(defaultName))
            } else {
              referencePath.replaceWith(types.identifier(defaultName))
            }
            importDefaultNames.push(defaultName)
          }
        })
        // importNames.push({ name: specifier.local.name, covertName: covertName })
      })
      // console.log(importNames)
      // 创建一个变量定义的 AST 节点
      const variableDeclaration = types.variableDeclaration('let', [
        types.variableDeclarator(
          types.identifier(covertName),
          types.callExpression(types.identifier('__webpack_require__'), [
            types.stringLiteral(importFilePath)
          ])
        )
      ])
      count++
      p.replaceWith(variableDeclaration) // 将当前节点替换为变量定义节点
    },
    ExportDefaultDeclaration(p) {
      hasExport = true
      // 跟前面import类似的，创建一个变量定义节点
      let name = p.node.declaration.name
      if (!name) return
      const variableDeclaration = types.variableDeclaration("const", [
        types.variableDeclarator(
          types.identifier("__WEBPACK_DEFAULT_EXPORT__"),
          types.identifier(p.node.declaration.name)
        ),
      ])

      // 将当前节点替换为变量定义节点
      p.replaceWith(variableDeclaration)
    },
    CallExpression (p) {
      let calleeName = p.node.callee.name
      if (importDefaultNames.includes(calleeName)) {
        let parent = p.parent
        if (parent && types.isCallExpression(parent)) {
          // 如果父级是函数调用，则去掉 "；"
          // 比如 console.log() 调用
          p.node.callee.name = `(0, ${calleeName})`
          return 
        }
        p.node.callee.name = `;(0, ${calleeName})`
      }
    }
  })

  let newCode = generate(ast).code
  if (hasExport) {
    newCode = `${EXPORT_DEFAULT_FUN} ${newCode}`
  }

  newCode = `${ESMODULE_TAG_FUN} ${newCode}`
  return {
    file,
    dependcies: [].concat(importFilePaths),
    code: newCode
  }
}
function parseFiles (entryFile) {
  const entryRes = parseFile(entryFile)
  let result = [entryRes]
  for (let p of result) {
    p.dependcies.forEach((dependency) => {
      if (dependency) {
        const file = parseFile(dependency)
        result.push(file)
      }
    })
  }
  return result
}
function generatelocalName (importFile) {
  return `__${importFile.split(path.sep).join('_')}`
}
let result = parseFiles(config.entry)
console.log(result[0].code)