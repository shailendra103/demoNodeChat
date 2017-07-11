  var socket = io.connect('http://localhost:3000');

  socket.on('connect', function(data) {
    socket.emit('join', 'Hello server from client');
  });


  // listener for 'thread' event, which updates messages
  socket.on('thread', function(data) {
    $('#chatthread').append('<li><span class="name">' + data.name + ' </span>: '+ data.message + '</li>');
  });

  // sends message to server, resets & prevents default form action
  $('form').submit(function() {
    var data = {};
    data.message = $('#message').val();
    data.name = $('#name').val();

    socket.emit('messages', data);
    this.reset();
    return false;
  });

