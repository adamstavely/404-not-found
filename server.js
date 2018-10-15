// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});

const players = {};
const usernames = [];

io.on('connection', function (socket) {
    socket.on('new player', function (username, callback) {
        if (!usernames.includes(username) && !players.hasOwnProperty(socket.id)) {
            console.log('New Player: ' + socket.id + ' - ' + username);
            socket.username = username;
            usernames.push(username);
            players[socket.id] = {
                x: 300,
                y: 300
            };
            updateUsernames();
            callback(true);
        } else {
            callback(false);
        }
    });
    socket.on('movement', function (data) {
        const player = players[socket.id] || {};
        if (data.left && player.x >= 5) {
            player.x -= 5;
        }
        if (data.up && player.y >= 5) {
            player.y -= 5;
        }
        if (data.right && player.x <= 795) {
            player.x += 5;
        }
        if (data.down && player.y <= 595) {
            player.y += 5;
        }
    });
    socket.on('disconnect', function () {
        // Remove disconnected player
        if (socket.id in players) {
            console.log('Removing player: ' + socket.id + ' - ' + socket.username);
            usernames.splice(usernames.indexOf(socket.username));
            delete players[socket.id];
            updateUsernames();
        }
    });
});

function updateUsernames() {
    console.log('Emitting usernames: ' + usernames);
    io.sockets.emit('usernames', usernames);
}

setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);
