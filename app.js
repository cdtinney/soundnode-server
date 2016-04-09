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
db.trackRequest = new Datastore({ filename: __dirname + '/db/' + '/trackRequest.db', autoload: true });
db.trackListen = new Datastore({ filename: __dirname + '/db/' + '/trackListen.db', autoload: true });

db.users.ensureIndex({ fieldName: 'userId', unique: true }, function (err) {
    console.log("Error - cannot insert user with duplicate ID");
});

db.playlists.ensureIndex({ fieldName: 'playlistId', unique: true }, function (err) {
    console.log("Error - cannot insert playlist with duplicate ID");
});

db.trackRequest.ensureIndex({ fieldName: 'trackId', unique: true }, function (err) {
    console.log("Error - cannot insert track request with duplicate track ID");
});

app.set('db', db);

app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

