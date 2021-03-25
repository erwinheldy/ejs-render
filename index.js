#!/usr/bin/env node

const fs = require('fs-extra')
const ejs = require('ejs')
const log = console.log.bind(console)
const path = require('path')
const chokidar = require('chokidar')

class compiler {

  constructor() {
    this.input = this.argv('input')
    this.data = this.argv('data')
    this.output = this.argv('output')
    this.watch = this.argv('watch')
  }

  async run() {
    if (this.watch) {
      chokidar.watch(this.input, { ignoreInitial: true })
        .on('add', async target => await this.renderTarget(target))
        .on('change', async target => await this.renderTarget(target))
        .on('unlink', async () => await this.renderAll())
        .on('ready', () => log('Waiting for file changes...'))
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
    let files = []
    fs.readdirSync(this.input).map(file => {
      if (file.endsWith('.ejs') && !file.startsWith('_')) { // ignore partial
        files.push(file)
      }
    })
    return files
  }

  async getCompiled(file, data) {
    let html = await ejs.renderFile(file, data)
    if (html.trim() == '') { // sometimes the result is empty, so we have to compile again
      html = await this.getCompiled(file, data)
    }
    return html
  }

  async render(file) {
    const filePath = path.join(this.input, file)
    if (fs.readFileSync(filePath, 'utf-8').trim() != '') {
      fs.readJSON(this.data, async (err, data) => {
        if (err) log(err)
        const html = await this.getCompiled(filePath, data)
        fs.outputFileSync(path.join(this.output, file.replace('.ejs', '.html')), html)
      })
    }
  }

  async renderAll() {
    const start = new Date()
    log('\nProcessing html...')

    fs.emptyDirSync(this.output)
    await Promise.all(this.getFiles().map(file => this.render(file)))

    log('Finished in', new Date().getTime() - start.getTime(), 'ms')
  }

  async renderPartial(target) {
    const partial = target.replace('.ejs', '')
    this.getFiles().forEach(async file => {
      const content = (await fs.readFile(path.join(this.input, file))).toString()
      if (content.includes(partial + "'") || content.includes(partial + '"')) {
        await this.render(file)
      }
    })
  }

  async renderTarget(target) {
    if (target === this.data) {
      await this.renderAll()
    }
    else {
      log('\nProcessing html...')

      const file = path.basename(target)
      const start = new Date()

      if (file.startsWith('_')) {
        await this.renderPartial(file)
      }
      else {
        await this.render(file)
      }
      log('Finished in', new Date().getTime() - start.getTime(), 'ms')
    }
  }

}

(async function () {
  await new compiler().run()
})()