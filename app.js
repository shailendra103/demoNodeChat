  var express = require("express");
  var app = express();
  var port = 3000;
  var bodyParser = require('body-parser');
  var passport = require('passport');
  var Strategy = require('passport-facebook').Strategy;
  var server = require('http').createServer(app);
  var io = require('socket.io').listen(server);
  var config = require('./config/oauth.js');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // Use application-level middleware for common functionality, including
  // logging, parsing, and session handling.
  app.use(require('morgan')('combined'));
  app.use(require('cookie-parser')());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));


  // Configure the Facebook strategy for use by Passport.
  passport.use(new Strategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOne({ id: profile.id }, function(err, user) {
            if(err) {
              console.log(err);  // handle errors!
            }
            if (!err && user !== null) {
              return cb(null, user);
            } else {
              user = new User({
                id: profile.id,
                name: profile.displayName
              });
              user.save(function(err) {
                if(err) {
                  console.log(err);  // handle errors!
                } else {
                  return cb(null, user);
                }
              });
            }
          });
      // return cb(null, profile);
    }));


  // Configure Passport authenticated session persistence.
  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });
  // Initialize Passport and restore authentication state, if any, from the
  // session.
  app.use(passport.initialize());
  app.use(passport.session());


  //Mongoose & MongoDB setup
  var mongoose = require("mongoose");
  mongoose.Promise = global.Promise;
  mongoose.connect("mongodb://localhost:27017/Users");
  var nameSchema = new mongoose.Schema({
      id: String,
      name: String
  });
  var User = mongoose.model("User", nameSchema);

  // Define routes.
  app.get('/',
    function(req, res) {
      res.render('index', { user: req.user });
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/chat', ensureAuthenticated, function(req, res){
    User.findById(req.session.passport.user, function(err, user) {
      if(err) {
        console.log(err);  // handle errors
      } else {
        res.render('chat', { user: user});
      }
    });
  });

  app.get('/login/facebook',
    passport.authenticate('facebook'));

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('/chat');

    });

  io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('join', function(data) {
    });

    client.on('messages', function(data){
      client.emit('thread', data);
      client.broadcast.emit('thread', data);
    });
  });


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
  }

  server.listen(port, () => {
      console.log("Server listening on port " + port);
  });