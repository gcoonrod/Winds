'use strict'
const glob = require('glob');
const path = require('path');

const ActionHero = require('actionhero')

module.exports = class MyInitializer extends ActionHero.Initializer {
  constructor () {
    super()
    this.name = 'models'
    this.loadPriority = 1011
    this.startPriority = 1011
    this.stopPriority = 1010
  }

  async initialize () {
    ActionHero.api['models'] = {}
    let modelFiles = glob.sync(path.join('models', '*.js'))
    //ActionHero.api.log('HERE:', 'notice', modelFiles)
    for (let index in modelFiles) {
      let model = require(__dirname + '/../' + modelFiles[index])

      ActionHero.api.models[model.schema] = model.model
      ActionHero.api.log(`Loaded model: ${model.schema}`, 'info')
    }

  }

  async start () {}
  async stop () {}
}
