var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');





// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: '500464776961653',
    clientSecret: '3259e9a43457a53b2713b854cf5587ac',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.

    return cb(null, profile);
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
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



//Mongoose setup
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/fb");
var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String
});
var User = mongoose.model("User", nameSchema);

// Define routes.
app.get('/',
  function(req, res) {
    res.render('index', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('without callback');
    //console.log(req.user );
    res.redirect('/chat');
  });

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
console.log('with callback');
    console.log(req.user );
    res.redirect('/chat');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

//old routes
// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });

// app.post("/addname", (req, res) => {
//     var myData = new User(req.body);
//     //console.log(myData);
//     myData.save()
//         .then(item => {
//           console.log('##user saved to database');
//           //console.log(item);
//             //res.send("Name saved to database");
//             res.redirect('/chat');
//         })
//         .catch(err => {
//             res.status(400).send("Unable to save to database");
//         });
// });

app.get('/chat', ensureAuthenticated, function(req, res){
  res.render('chat', { user: req.user, title: 'Chat' });
});

io.on('connection', function(client) {
  console.log('Client connected...');

  client.on('join', function(data) {
    console.log(data);
  });

  client.on('messages', function(data){
    client.emit('thread', data);
    client.broadcast.emit('thread', data);
  });
});


function ensureAuthenticated(req, res, next) {
  return next();
  //TODO change it
  // if (req.isAuthenticated()) { return next(); }
  // res.redirect('/login')
}

app.listen(3000);
// app.listen(port, () => {
//     console.log("Server listening on port " + port);
// });