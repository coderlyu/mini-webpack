#!/usr/bin/env node

const path = require('path')
const fs = require('fs')


let config = require(path.resolve('webpack.config.js'))

let Compiler = require('../lib/Compiler')

let comipler = new Compiler(config)
comipler.start()