var express = require('express'),
  router = express.Router()
  
module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res) {
    
    var db = req.app.get('db');
    getAllCollections(db, function(users, userPlaylists, playlists) {
    
        res.render('index', {
          title: 'SoundNode server',
          users: users,
          userPlaylists: userPlaylists,
          playlists: playlists
        });
    
    });
    
    
});

function getAllCollections(db, callback) {

    db.users.find({}, function(err, users) {
        db.userPlaylist.find({}, function(err, userPlaylists) {            
            db.playlists.find({}, function(err, playlists) {
                callback(users, userPlaylists, playlists);
            });            
        });        
    });
}

router.get('/get', function (req, res) {

    var userId = req.query.userId;    
    if (userId === undefined) {
        sendError(res);
        return;
    } 
    
    var db = req.app.get('db');
    findUserById(db, userId, function(user) {
    
        if (user === undefined) {
            sendError(res);
            return;
        }
        
        findPlaylistsByUserId(db, user.userId, function(playlists) {
            console.log("findPlaylistsByUserId callback returned");
        });
            
    });
    
});

router.post('/share', function(req, res) {

    var userId = req.query.userId;
    var playlistId = req.query.playlistId;    
    if (userId == undefined || playlistId == undefined) {
        sendError(res);
        return;
    }
    
    var db = req.app.get('db');
    findUserById(db, userId, function(user) {
    
        if (user === null) {
            sendError(res);
            return;
        }
    
        createSharedPlaylist(db, userId, playlistId, function(newPlaylist) {
        
            if (newPlaylist === null)
                sendError(res)
            else
                sendOk(res);
        
        });
    
    });

});

function findUserById(db, id, callback) {

    db.users.find({ userId: id }, function (err, users) {    
    
        if (err) {
            console.log("[findUserById] - " + id + " - " + err);
            callback(undefined);
        }
        
        // Return the first element - there should be only one!
        if (users.length > 0) {   
            callback(users[0]);
            
        // Insert a new user into the collection
        } else {
            createNewUser(db, id, callback);
        
        }
        
    });

}

function createNewUser(db, id, callback) {
            
    var user = { userId: id };
    db.users.insert(user, function (err, newUser) {  
    
        if (err) {
            console.log("[findUserById] - " + id + " - Failed to create user");
            callback(null);
        }
        
        console.log("[findUserById] - " + id + " - Created new user!");
        callback(newUser);
        
    });

}

function createSharedPlaylist(db, userId, playlistId, callback) {

    var playlist = { playlistId : playlistId };
    var userPlaylist = { userId : userId, playlistId : playlistId, isOwner : true };
    
    db.playlists.insert(playlist, function (err, newPlaylist) {
        
        if (err) {
            console.log("[createSharedPlaylist] - " + userId + " - Failed to create playlists entry");
            callback(null);
            return;
        }
        
        db.userPlaylist.insert(userPlaylist, function (err, newUserPlaylist) {
        
            if (err) {
                console.log("[createSharedPlaylist] - " + userId + " - Failed to create userPlaylist entry");
                callback(null);
                // TODO - Get rid of playlists entry - needs to be atomic
            }
            
            console.log("[createSharedPlaylist] - " + userId + " - Created userPlaylist entry");
            callback(newPlaylist)
            
        });
    
    });
}

function findPlaylistsByUserId(db, userId, callback) {

    db.userPlaylist.find( {userId : userId}, function(err, userPlaylists) {
    
        if (err) {
            console.log("[findPlaylistsByUserId] - " + userId + " - Failed to find userPlaylists entries");
            callback(null);
        }
        
        console.log("[findPlaylistsByUserId] - " + userId + " - Found entries - " + userPlaylists.length);
        
    });

}

function sendOk(res) {
    res.sendStatus(200);
}

function sendError(res) {
    res.sendStatus(400);
}