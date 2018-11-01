// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const Promise = require('bluebird');
const Database = require('./database');
const User = require('./user');

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

const db = new Database('./clueless.sqlite3');
const user = new User(db);

user.createTable();

io.on('connection', function (socket) {
    socket.on('login', function ([username, password], callback) {
        user.getByUsername(username).then((result) => {
            if (result) {
                if (!usernames.includes(username.toLowerCase()) && !players.hasOwnProperty(socket.id)) {
                    if (result.password === password) {
                        console.log('Player has logged in: ' + socket.id + ' - ' + username);
                        socket.username = username;
                        usernames.push(username);
                        players[socket.id] = {
                            x: 300,
                            y: 300
                        };
                        updateUsernames();
                        callback(true);
                    } else {
                        console.log('Incorrect password');
                        callback(false);
                    }
                } else {
                    console.log('User is already logged in');
                    callback(false);
                }
            } else {
                console.log('Username does not exist');
                callback(false);
            }
        });
    });
    socket.on('register', function ([username, password], callback) {
        user.getByUsername(username).then((result) => {
            if (!result) {
                if (!usernames.includes(username.toLowerCase()) && !players.hasOwnProperty(socket.id)) {
                    user.create(username, password).then((result) => {
                        if (result) {
                            console.log('Player has registered: ' + socket.id + ' - ' + username);
                            socket.username = username;
                            usernames.push(username);
                            players[socket.id] = {
                                x: 300,
                                y: 300
                            };
                            updateUsernames();
                            callback(true);
                        } else {
                            console.log('Registration failed');
                            callback(false);
                        }
                    });
                } else {
                    console.log('User is already logged in');
                    callback(false);
                }
            } else {
                console.log('Username already exist');
                callback(false);
            }
        });
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
