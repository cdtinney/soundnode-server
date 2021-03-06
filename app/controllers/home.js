var express = require('express'),
  router = express.Router()
  
module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res) {
    
    var db = req.app.get('db');
    getAllCollections(db, function(users, userPlaylists, playlists, trackRequests) {
    
        res.render('index', {
          title: 'SoundNode server',
          users: users,
          userPlaylists: userPlaylists,
          playlists: playlists,
          trackRequests: trackRequests
        });
    
    });
    
    
});

function getAllCollections(db, callback) {

    db.users.find({}, function(err, users) {
        db.userPlaylist.find({}, function(err, userPlaylists) {            
            db.playlists.find({}, function(err, playlists) {       
                db.trackRequest.find({}, function(err, trackRequests) {
                    callback(users, userPlaylists, playlists, trackRequests);
                });            
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

router.get('/playlists/tracks', function(req, res) {

    var playlistId = req.query.playlistId;    
    if (playlistId === undefined) {
        sendError(res, "playlistId not specified");
        return;
    } 
    
    var db = req.app.get('db');
    getTrackRequests(db, playlistId, function(trackRequests) {
    
        if (trackRequests === null)
            sendError(res, "Failed to retrieve track requests");
        else
            sendOk(res, trackRequests);
    
    });

});

/* TODO - remove /status */
router.post('/playlists/tracks/status', function(req, res) {

    var userId = req.query.userId;    
    var trackId = req.query.trackId;
    var playlistId = req.query.playlistId;    
    var status = req.query.status;
    if (trackId === undefined || userId === undefined || playlistId === undefined || status === undefined) {
        sendError(res, "userId/trackId/playlistId/status not specified");
        return;
    } 
    
    var db = req.app.get('db');
    updateTrackRequestStatus(db, userId, trackId, playlistId, status, function(response) {
    
        if (response === null)
            sendError(res, "Failed to update track request status");
        else
            sendOk(res, response);
    
    });

});

/* TODO - switch to PUT */
router.post('/playlists/tracks/add', function(req, res) {

    var userId = req.query.userId;    
    var trackId = req.query.trackId;
    var playlistId = req.query.playlistId;    
    if (trackId === undefined || userId === undefined || playlistId === undefined) {
        sendError(res, "userId/trackId/playlistId not specified");
        return;
    } 
    
    var db = req.app.get('db');
    addTrackToPlaylist(db, userId, trackId, playlistId, function(response) {
    
        if (response === null)
            sendError(res, "Failed to add track (via request) to shared playlist");
        else
            sendOk(res, response);
    
    });

});

router.post('/playlists/tracks/remove', function(req, res) {

    var userId = req.query.userId;    
    var trackId = req.query.trackId;
    var playlistId = req.query.playlistId;    
    if (trackId === undefined || userId === undefined || playlistId === undefined) {
        sendError(res, "userId/trackId/playlistId not specified");
        return;
    } 
    
    var db = req.app.get('db');
    removeTrackFromPlaylist(db, userId, trackId, playlistId, function(response) {
    
        if (response === null)
            sendError(res, "Failed to remove track (via request) from shared playlist");
        else
            sendOk(res, response);
    
    });

});

router.get('/playlists/tracks/listen', function(req, res) {

    var userId = req.query.userId;    
    var playlistId = req.query.playlistId;    
    if (userId === undefined || playlistId === undefined) {
        sendError(res, "userId/playlistId not specified");
        return;
    } 
    
    var db = req.app.get('db');
    getTracksListened(db, userId, playlistId, function(response) {
    
        if (response === null)
            sendError(res, "Failed to retrieve listened tracks");
        else
            sendOk(res, response);
    
    });

});

router.post('/playlists/tracks/listen', function(req, res) {

    var userId = req.query.userId;    
    var trackId = req.query.trackId;
    var playlistId = req.query.playlistId;    
    var listened = req.query.listened;
    if (trackId === undefined || userId === undefined || playlistId === undefined || listened === undefined) {
        sendError(res, "userId/trackId/playlistId/listened not specified");
        return;
    } 
    
    var db = req.app.get('db');
    setTrackListened(db, userId, trackId, playlistId, listened, function(response) {
    
        if (response === null)
            sendError(res, "Failed to update track listened status");
        else
            sendOk(res, response);
    
    });

});

/* TODO - switch to PUT */
router.post('/playlists/users/add', function (req, res) {

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

router.delete('/playlists/users', function (req, res) {

    var userId = req.query.userId;    
    var playlistId = req.query.playlistId;    
    if (userId === undefined || playlistId === undefined) {
        sendError(res, "User or Playlist ID not specified");
        return;
    } 
    
    var db = req.app.get('db');
    removeUserFromPlaylist(db, userId, playlistId, function(response) {
    
        if (response === null) {
            sendError(res, "Failed to remove user from playlist");
            return;
        }
        
        sendOk(res, response);    
    
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
        
            // Remove TrackRequest entries
            db.trackRequest.remove( { playlistId: playlistId }, {}, function(err, numRemoved) {
            
                if (err || numRemoved === 0) {
                    console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Failed to remove trackRequest entries");
                    callback(null);
                    return;  
                }
                
                console.log("[removeSharedPlaylist] - playlistId: " + playlistId + " - Removed trackRequest entries: " + numRemoved);
                callback(numRemoved);
            
            });
        
        });
        
    });
    
}

function getTrackRequests(db, playlistId, callback) {

    db.trackRequest.find(  { $and: [{status : "pending"}, {playlistId : playlistId}] }, function(err, trackRequests) {

        if (err) {
            console.log("[getTrackRequests] - " + playlistId + " - Failed to find track requests");
            console.log(err);
            callback(null);                 
            return; 
        }

        callback(trackRequests);
    
    });

}

function addTrackToPlaylist(db, userId, trackId, playlistId, callback) {

    db.playlists.find( {playlistId : playlistId}, function(err, playlist) {
    
        if (err) {
            console.log("[addUserToPlaylist] - " + playlistId + " - Failed to find playlist");
            callback(null);                 
            return; 
        }
        
        var trackRequest = { trackId : trackId, playlistId : playlistId, userId : userId, requestType : "add", status : "pending" };
        db.trackRequest.insert(trackRequest, function (err, newTrackRequest) {
        
            if (err) {
                console.log("[addTrackToPlaylist] - " + trackId + " - Failed to add track request");
                console.log(err);
                callback(null);   
                return;
            }
            
            console.log("[addTrackToPlaylist] - " + trackId + " - Successfully added track request");
            callback(newTrackRequest)
            
        });
        
    });

}

function removeTrackFromPlaylist(db, userId, trackId, playlistId, callback) {

    db.playlists.find( {playlistId : playlistId}, function(err, playlist) {
    
        if (err) {
            console.log("[removeTrackFromPlaylist] - " + playlistId + " - Failed to find playlist");
            callback(null);                 
            return; 
        }
        
        var trackRequest = {
            trackId : trackId,
            playlistId : playlistId,
            userId : userId,
            requestType : "remove",
            status : "pending"            
        };
        db.trackRequest.update(  { $and: [{trackId : trackId}, {playlistId : playlistId}] },  trackRequest, { upsert: true}, function(err, newRequest) {
        
            if (err || newRequest === undefined) {
                console.log("[removeTrackFromPlaylist] - " + trackId + " - Failed to update track request");
                console.log(err);
                callback(null);   
                return;
            }
            
            console.log("[removeTrackFromPlaylist] - " + trackId + " - Successfully updated track request!");
            callback(newRequest);
        
        });
        
    });

}

function updateTrackRequestStatus(db, userId, trackId, playlistId, status, callback) {
    
    db.playlists.find( {playlistId : playlistId}, function(err, playlist) {

        if (err) {
            console.log("[addUserToPlaylist] - " + playlistId + " - Failed to find playlist");
            callback(null);                 
            return; 
        }
        
        db.trackRequest.update({ trackId: trackId }, { $set: { status: status } }, { multi: false }, function (err, numUpdated) {
        
            if (err || numUpdated === 0) {
                console.log("[updateTrackRequestStatus] - " + trackId + " - Failed to add update track request");
                console.log(err);
                callback(null);   
                return;
            }
            
            console.log("[updateTrackRequestStatus] - " + trackId + " - Successfully updated track request - " + status);
            callback(numUpdated);
            
        });
        
    });

}

function getTracksListened(db, userId, playlistId, callback) {

    var trackListen = {
        userId : userId,
        playlistId : playlistId
    };
    
    db.trackListen.find(  { $and: [{userId : userId }, {playlistId : playlistId}, {listened : "true" }] }, function(err, trackListens) {
    
        if (err || trackListens === undefined) {
            console.log("[getTracksListened] - " + playlistId + " - Failed to find track listens");
            console.log(err);
            callback(null);   
            return;
        }
        
        console.log("[getTracksListened] - " + playlistId + " - Successfully retrieved track listens - " + trackListens.length);
        callback(trackListens);
    
    });

}

function setTrackListened(db, userId, trackId, playlistId, listened, callback) {

    var trackListen = {
        userId : userId,
        trackId : trackId,
        playlistId : playlistId,
        listened :  listened          
    };
    
    db.trackListen.update(  { $and: [{userId : userId }, {trackId : trackId}, {playlistId : playlistId}] },  
        trackListen, { upsert: true}, function(err, newTrackListen) {
    
        if (err || newTrackListen === undefined) {
            console.log("[setTrackListened] - " + trackId + " - Failed to update track listen");
            console.log(err);
            callback(null);   
            return;
        }
        
        console.log("[setTrackListened] - " + trackId + " - Successfully updated track listen!");
        callback(newTrackListen);
    
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
        db.userPlaylist.find( { $and: [{userId : userId}, {playlistId : playlistId}] }, function(err, existingUserPlaylists) {
            
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

function removeUserFromPlaylist(db, userId, playlistId, callback) {

    db.userPlaylist.remove( {$and: [{userId: userId}, {playlistId: playlistId}] }, {}, function(err, numRemoved) {
    
        if (err) {
            console.log("[removeUserFromPlaylist] - Failed to remove user from UserPlaylist database");
            callback(null);               
            return;        
        }
        
        console.log("[removeUserFromPlaylist] - Removed entries from UserPlaylist database - " + numRemoved);
        callback(numRemoved);
    
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