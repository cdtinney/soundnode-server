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
    var userName = req.query.userName;
    if (userId === undefined) {
        sendError(res, "User ID not specified");
        return;
    } 
    
    var db = req.app.get('db');
    findOrCreateUserById(db, userId, userName, function(user) {
    
        if (user === undefined) {
            sendError(res, "Failed to find user");
            return;
        }
        
        findPlaylistsByUserId(db, user.userId, function(playlists) {
            sendOk(res, playlists);            
        });
            
    });
    
});

router.get('/users', function (req, res) {

    var playlistId = req.query.playlistId;    
    if (playlistId === undefined) {
        sendError(res, "Playlist ID not specified");
        return;
    } 
    
    var db = req.app.get('db');
    getPlaylistUsers(db, playlistId, function(users) {
    
        if (users === undefined) {
            sendError(res, "Failed to find users for playlist - " + playlistId);
            return;
        }
        
        sendOk(res, users);            
            
    });
    
});

router.post('/users/add', function (req, res) {

    var userId = req.query.userId;    
    var userName = req.query.userName;    
    var playlistId = req.query.playlistId;    
    if (userId === undefined || playlistId === undefined) {
        sendError(res, "User or Playlist ID not specified");
        return;
    } 
    
    var db = req.app.get('db');
    findOrCreateUserById(db, userId, userName, function(user) {
    
        if (user === null) {
            sendError(res, "Failed to find/create user");
            return;
        }
    
        addUserToPlaylist(db, userId, userName, playlistId, function(userPlaylist) {
        
            if (userPlaylist === null)
                sendError(res, "Failed to add user to shared playlist");
            else
                sendOk(res, userPlaylist);
        
        });
    
    });
    
});

router.post('/share', function(req, res) {

    var userId = req.query.userId;
    var userName = req.query.userName;
    var playlistId = req.query.playlistId;    
    if (userId == undefined || playlistId == undefined) {
        sendError(res, "User and playlist IDs not specified");
        return;
    }
    
    var db = req.app.get('db');
    findOrCreateUserById(db, userId, userName, function(user) {
    
        if (user === null) {
            sendError(res, "Failed to find user");
            return;
        }
    
        createSharedPlaylist(db, userId, playlistId, function(newPlaylist) {
        
            if (newPlaylist === null)
                sendError(res, "Failed to create shared playlist");
            else
                sendOk(res, newPlaylist);
        
        });
    
    });

});

router.post('/unshare', function(req, res) {

    // TODO - Fix duplicate paramater validation (share, unshare)
    var userId = req.query.userId;
    var userName = req.query.userName;
    var playlistId = req.query.playlistId;    
    if (userId == undefined || playlistId == undefined) {
        sendError(res, "User and playlist IDs not specified");
        return;
    }
    
    var db = req.app.get('db');
    findOrCreateUserById(db, userId, userName, function(user) {
    
        if (user === null) {
            sendError(res, "Failed to find user");
            return;
        }
    
        removeSharedPlaylist(db, userId, playlistId, function(numRemoved) {
        
            if (numRemoved === null || numRemoved === 0)
                sendError(res, "Failed to removed shared playlist");
            else
                sendOk(res, { numRemoved: numRemoved });
        
        });
    
    });

});

function findOrCreateUserById(db, id, userName, callback) {

    db.users.find({ userId: id }, function (err, users) {    
    
        if (err) {
            console.log("[findOrCreateUserById] - " + id + " - " + err);
            callback(undefined);
        }
        
        // Return the first element - there should be only one!
        if (users.length > 0) {   
            callback(users[0]);
            
        // Insert a new user into the collection
        } else {
            createNewUser(db, id, userName, callback);
        
        }
        
    });

}

function createNewUser(db, id, userName, callback) {
            
    var user = { userId: id, userName: userName};
    db.users.insert(user, function (err, newUser) {  
    
        if (err) {
            console.log("[findOrCreateUserById] - " + id + " - Failed to create user");
            callback(null);
        }
        
        console.log("[findOrCreateUserById] - " + id + " - Created new user - " + userName);
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

function removeSharedPlaylist(db, userId, playlistId, callback) {

    // Remove UserPlaylist entries
    db.userPlaylist.remove( { playlistId: playlistId }, { multi: true }, function(err, numRemoved) {
        
        if (err || numRemoved === 0) {
            console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Failed to remove UserPlaylist entries");
            callback(null);
            return;        
        }
        
        console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Removed UserPlaylist entries: " + numRemoved);
        
        // Remove Playlists entry
        db.playlists.remove( { playlistId: playlistId }, {}, function(err, numRemoved) {
        
            if (err || numRemoved === 0) {
                console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Failed to remove playlists entry");
                callback(null);
                return;  
            }
            
            console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Removed playlist entry: " + numRemoved);
            callback(numRemoved);
        
        });
        
    });
    
}

function addUserToPlaylist(db, userId, userName, playlistId, callback) {

    // First, check if the playlist exists
    db.playlists.find( {playlistId : playlistId}, function(err, playlist) {
    
        if (err) {
            console.log("[addUserToPlaylist] - " + playlistId + " - Failed to find playlist");
            callback(null);                 
            return; 
        }
        
        // Then, check if the user is already added
        db.userPlaylist.find( {$and: [{userId : userId}, {playlistId : playlistId}] }, function(err, existingUserPlaylists) {
            
            if (err) {
                console.log("[addUserToPlaylist] - " + playlistId + " - Failed to query UserPlaylist database");
                callback(null);               
                return;
            }
            
            if (existingUserPlaylists !== undefined && existingUserPlaylists.length > 0) {
                console.log("[addUserToPlaylist] - " + playlistId + " - User already added - " + userName);
                callback("User already added to playlist");              
                return;
            }
            
            var userPlaylist = { userId : userId, playlistId : playlistId, isOwner : false };
            db.userPlaylist.insert(userPlaylist, function (err, newUserPlaylist) {
            
                if (err) {
                    console.log("[createSharedPlaylist] - " + userId + " - Failed to create userPlaylist entry - " + userName);
                    callback(null);   
                    return;
                }
                
                console.log("[createSharedPlaylist] - " + userId + " - Created userPlaylist entry - " + userName);
                callback(newUserPlaylist)
                
            });
        
        });
    
    });

}

function getPlaylistUsers(db, playlistId, callback) {

    db.userPlaylist.find( {playlistId : playlistId}, function(err, userPlaylists) {
    
        if (err) {
            console.log("[getPlaylistUsers] - " + playlistId + " - Failed to find userPlaylists entries");
            callback(null);
            return;
        }
        
        console.log("[getPlaylistUsers] - " + playlistId + " - Found entries in UserPlaylist - " + userPlaylists.length);
        
        var userIds = getUniqueUserIds(userPlaylists);        
        db.users.find({ userId: { $in: userIds }}, function (err, users) {
    
            if (err) {
                console.log("[getPlaylistUsers] - " + playlistId + " - Failed to find user entries");
                callback(null);
                return;
            }
            
            callback(users);
          
        })        
        
    });

}

function getUniqueUserIds(userPlaylists) {

    var obj = {};
    for (var i=0; i<userPlaylists.length; i++) {
        obj[userPlaylists[i].userId] = userPlaylists[i].userId;
    }
    
    var arr = [];
    for (id in obj) {
        arr.push(id);
    }
    
    return arr;

}

function findPlaylistsByUserId(db, userId, callback) {

    db.userPlaylist.find( {userId : userId}, function(err, userPlaylists) {
    
        if (err) {
            console.log("[findPlaylistsByUserId] - " + userId + " - Failed to find userPlaylists entries");
            callback(null);
        }
        
        console.log("[findPlaylistsByUserId] - " + userId + " - Found entries - " + userPlaylists.length);
        callback(userPlaylists);
        
    });

}

function sendOk(res, obj) {

    if (obj !== undefined) {
        res.status(200).json(obj);
    } else {
        res.sendStatus(200);
    }
    
}

function sendError(res, message) {
    res.status(400).json({ error: message })
}