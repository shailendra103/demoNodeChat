var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser'),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

//Mongoose setup
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo");
var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String
});
var User = mongoose.model("User", nameSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/addname", (req, res) => {
    var myData = new User(req.body);
    console.log(myData);
    myData.save()
        .then(item => {
          console.log('qqqqqq');
          console.log(item);
            res.send("Name saved to database");
            res.redirect('/chat');
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

app.get('/chat', ensureAuthenticated, function(req, res){
  res.render('chat', { user: req.user, title: 'Chat' });
});

function ensureAuthenticated(req, res, next) {
  return next();
  //TODO change it
  // if (req.isAuthenticated()) { return next(); }
  // res.redirect('/login')
}

app.listen(port, () => {
    console.log("Server listening on port " + port);
});