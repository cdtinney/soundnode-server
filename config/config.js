var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'soundnode-server'
    },
    port: 3000,
    db: 'mongodb://localhost/soundnode-server-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'soundnode-server'
    },
    port: 3000,
    db: 'mongodb://localhost/soundnode-server-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'soundnode-server'
    },
    port: 3000,
    db: 'mongodb://localhost/soundnode-server-production'
  }
};

module.exports = config[env];
