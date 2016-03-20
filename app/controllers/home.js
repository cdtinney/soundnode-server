var express = require('express'),
  router = express.Router()

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res) {
    res.render('index', {
      title: 'SoundNode server'
    });
});

router.get('/get', function (req, res) {

    var userId = req.query.userId;    
    if (userId === undefined) {
        sendError(res);
        return;
    } 
    
    var user = findUserById(req.app.get('db'), userId);
    if (user === null) {
        sendError(res);
        return;
    }
    
    sendOk(res);
    
});

router.post('/share', function(req, res) {

    var userId = req.query.userId;
    var playlistId = req.query.playlistId;    
    if (userId == undefined || playlistId == undefined) {
        sendError(res);
        return;
    }
    
    var user = findUserById(req.app.get('db'), userId);
    if (user === null) {
        sendError(res);
        return;
    }
    
    var playlist = createSharedPlaylist(req.app.get('db'), userId, playlistId);
    playlist === null ? sendError(res) : sendOk(res);

});

function sendOk(res) {
    res.sendStatus(200);
}

function sendError(res) {
    res.sendStatus(400);
}

function findUserById(db, userId) {

    return db.users.find({ userId: userId }, function (err, users) {    
    
        if (err) {
            console.log("GET user - " + userId + " - " + err);
            return null;
        }
        
        console.log("GET user - " + userId + " - Users found: " + users.length);
        
        if (users.length === 0) {        
        
            console.log("GET user - " + userId + " - Creating new user...");
            var user = { userId: userId };
            return db.users.insert(user, function (err, newUser) {  
                if (err) return null;
                console.log("GET user - " + userId + " - Successfully created!");
                return newUser;
            });
            
        } else {
        
            // Return the first element - there should be only one!
            return users[0];
            
        }
        
    });

}

function createSharedPlaylist(db, ownerId, playlistId) {

    var playlist = { playlistId : playlistId };
    var userPlaylist = { ownerId : ownerId, playlistId : playlistId, isOwner : true };
    
    return db.playlists.insert(playlist, function (err, newPlaylist) {
        
        if (err) {
            console.log("Create shared playlist - " + ownerId + " - Failed to create playlists entry");
            return null;
        }
        
        var created = db.userPlaylist.insert(userPlaylist, function (err, newUserPlaylist) {
        
            if (err) {
                console.log("Create shared playlist - " + ownerId + " - Failed to create userPlaylists entry");
                return null;
            }
            
            console.log("Create shared playlist - " + ownerId + " - Success");
            return newUserPlaylist;
            
        });
        
        if (created === null) {
            return null;
        } 
        
        return newPlaylist;
    
    });
}