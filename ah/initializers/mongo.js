'use strict'

const mongoose = require('mongoose');

const ActionHero = require('actionhero')

module.exports = class MyInitializer extends ActionHero.Initializer {
  constructor () {
    super()
    this.name = 'mongo'
    this.loadPriority = 1010
    this.startPriority = 1010
    this.stopPriority = 1010
  }

  async initialize () {
    ActionHero.api.mongo = {}
  }

  async start () {
    const api = ActionHero.api;
    try {
      api.mongo.db = await mongoose.connect(api.config.mongo.uri, api.config.mongo.options)
      api.log(`Successfully connected to ${api.config.mongo.uri}`, 'info')
    } catch (error) {
      api.log('Error during mongo initialization', 'error', error)
      throw error
    }
  }
  async stop () {
    const api = ActionHero.api;
    await api.mongo.db.disconnect()
    api.log(`Disconnected from ${api.config.mongo.uri}`, 'info')
  }
}
