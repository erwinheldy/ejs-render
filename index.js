#!/usr/bin/env node

const log = console.log.bind(console)
const ejs = require('ejs')
const chokidar = require('chokidar')
const { basename, join } = require('path')
const { mkdirSync, writeFileSync, readdirSync, unlinkSync, readFileSync } = require('fs')

class compiler {

  constructor() {
    this.input  = this.argv('input')
    this.data   = this.argv('data')
    this.output = this.argv('output')
    this.watch  = this.argv('watch')
    this.delay  = this.argv('delay') || 200
    mkdirSync(this.output, { recursive: true })
  }

  async run() {
    if (this.watch) {
      chokidar.watch(this.input, { ignoreInitial: true }).on('all', async (event, target) => {
        setTimeout(async () => {
          if ((event === 'add' || event === 'change') && target !== this.data) {
            const start = new Date()
            log('\nProcessing...')

            const filename = basename(target)
            filename.startsWith('_') ? await this.renderPartial(filename) : await this.render(filename)

            log('Finished in', new Date().getTime() - start.getTime(), 'ms')
          }
          else {
            await this.renderAll()
          }
        }, this.delay)
      }).on('ready', () => log('Waiting for file changes...'))
    }
    else {
      await this.renderAll()
    }
  }

  argv(key) {
    const arg = process.argv.filter(val => val.startsWith('--' + key))
    return arg.length ? arg.pop().split('=').pop() : null
  }

  getFiles() {
    return readdirSync(this.input).filter(file => file.endsWith('.ejs') && !file.startsWith('_'))
  }

  async render(file) {
    const html = await ejs.renderFile(
      join(this.input, file),
      JSON.parse(readFileSync(this.data, 'utf-8'))
    )
    return writeFileSync(join(this.output, basename(file, '.ejs') + '.html'), html)
  }

  async renderAll() {
    const start = new Date()
    log('\nProcessing...')

    readdirSync(this.output).map(file => unlinkSync(join(this.output, file)))
    await Promise.all(this.getFiles().map(file => this.render(file)))

    log('Finished in', new Date().getTime() - start.getTime(), 'ms')
  }

  async renderPartial(target) {
    const partial = basename(target, '.ejs')
    this.getFiles().forEach(async file => {
      const content = readFileSync(join(this.input, file), 'utf-8')
      if (content.includes(partial + "'") || content.includes(partial + '"')) {
        await this.render(file)
      }
    })
  }

}

(async function () {
  await new compiler().run()
})()