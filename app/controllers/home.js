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
        res.sendStatus(400);
        return;
    } 
    
    var users = findUser(req.app.get('db'), userId);
    var statusCode = users === null ? 400 : 200;
    res.sendStatus(statusCode);
    
});

router.post('/share', function(req, res) {

    var userId = req.query.userId;
    var playlistId = req.query.playlistId;    
    if (userId === undefined || playlistId === undefined) {
        console.log("1");
        res.sendStatus(400);
        return;
    }
    
    var users = findUser(req.app.get('db'), userId);
    var statusCode = users === null ? 400 : 200;
    res.sendStatus(statusCode);

});

function findUser(db, userId) {
        
    db.users.find({ userId: userId }, function (err, users) {    
        if (err) return null;
        console.log("GET user - " + userId + " - Users found: " + users.length);
        return users;
    });

}