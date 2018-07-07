exports['default'] = {
  mongo: api => {
    return {
      uri: process.env.DATABASE_URI || 'mongodb://localhost/WINDS',
      options: {
        autoIndex: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 50,
        bufferMaxEntries: 0,
        keepAlive: 120,
      },

    }
  },
}