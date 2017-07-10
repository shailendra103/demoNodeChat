var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
//var server = require('http').createServer(app);
 //var io = require('socket.io').listen(server);
 //var io = require('socket.io').listen(server);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
//app.use('/socket.io', express.static(__dirname + '/socket.io'))
app.set('views', __dirname + '/views');
//app.use(express.static(__dirname + '/views'));
app.set('view engine', 'jade');


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
 // var io = require('socket.io')(server);
 //var io = require('socket.io').listen(server);
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
    //console.log(myData);
    myData.save()
        .then(item => {
          console.log('##user saved to database');
          //console.log(item);
            //res.send("Name saved to database");
            res.redirect('/chat');
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

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

server.listen(port, () => {
    console.log("Server listening on port " + port);
});
// app.listen(port, () => {
//     console.log("Server listening on port " + port);
// });