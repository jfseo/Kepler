const app = require('./app'),
      gameServer = require('./server/game-server');

const server = app.listen(app.get('port'), function () {
  console.log(`App listening on port ${app.get('port')}`);
})

/* Socket.IO server set up. */
//http://rubentd.com/blog/creating-a-multiplayer-game-with-node-js/
//https://github.com/rubentd/tanks/blob/master/index.js
const io = require('socket.io')(server);
const game = new gameServer();

let playerCount = 0;
let generate = undefined;

io.on('connection', function(client) {
  if (generate == undefined) {
    generate = setInterval(function() { game.generateObstacles() }, 500);
    console.log(generate);
  }
  // if (playerCount == 0) {
  //   clearInterval(generate);
  // }
  client.on('joinGame', function(user) {
    console.log(`${user.id} has joined the game`);
    playerCount += 1;
    console.log(playerCount);
    //client.emit('addTank', ship);
    client.broadcast.emit('addShip', game.addShip(user.x, user.y, user.id));
  });

  client.on('sync', (data) => {
    //Receive data from clients
    if (data.ship != undefined) {
      game.syncShip(data.ship);
    }

    //update obstacle positions
    game.syncObstacles();

    //Broadcast data to clients
    client.emit('sync', game.getData());
    client.broadcast.emit('sync', game.getData());

    //clean up
    game.cleanShips();
    game.cleanObstacles();
  });

  client.on('leaveGame', (userId) => {
    console.log(`${userId} has left the game.`);
    game.removeShip(userId);
    playerCount -= 1;
    client.broadcast.emit('removeShip', userId);
  });
});
