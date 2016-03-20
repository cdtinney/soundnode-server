var express = require('express'),
  config = require('./config/config'),
  glob = require('glob')

var app = express();
require('./config/express')(app, config);

var Datastore = require('nedb')
  , path = require('path')
var db = {}
db.users = new Datastore({ filename: __dirname + '/db/' + '/users.db', autoload: true });
db.playlists = new Datastore({ filename: __dirname + '/db/' + '/playlists.db', autoload: true });
db.userPlaylist = new Datastore({ filename: __dirname + '/db/' + '/userPlaylist.db', autoload: true });
db.invites = new Datastore({ filename: __dirname + '/db/' + '/invites.db', autoload: true });

app.set('db', db);

app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

