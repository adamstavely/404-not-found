// Dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const Promise = require('bluebird');
const Database = require('./models/database');
const User = require('./models/user');

// Create the server
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const sessionMiddleware = session({
    key: 'user_sid',
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
});

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

let sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/game');
    } else {
        next();
    }
};

// Routing
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/index');
});

// Route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.redirect('/index');
    })
    .post((req, res) => {
        const username = req.body.username;
        const email = req.body.email.toLowerCase();
        const password = req.body.password;

        user.getByUsername(username.toLowerCase()).then((result) => {
            if (!result) {
                user.create(username.toLowerCase(), email, password).then((result) => {
                    if (result) {
                        console.log('Player has registered: ' + username);
                        req.session.user = username;
                        res.redirect('/game');
                    } else {
                        console.log('Registration failed');
                        res.redirect('/index');
                    }
                });
            } else {
                console.log('Username already exists');
                res.redirect('/index');
            }
        });
    });

// Route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.redirect('/index');
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        user.getByUsername(username.toLowerCase()).then((result) => {
            if (result) {
                if (!usernames.includes(username.toLowerCase())) {
                    if (result.password === password) {
                        console.log('Player has logged in: ' + username);
                        req.session.user = username;
                        res.redirect('/game');
                    } else {
                        console.log('Incorrect password');
                        res.redirect('/index');
                    }
                } else {
                    console.log('User is already logged in');
                    res.redirect('/index');
                }
            } else {
                console.log('Username does not exist');
                res.redirect('/index');
            }
        });
    });

// Route for index page
app.route('/index')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/views/index.html');
    });

// Route for main game
app.get('/game', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile(path.join(__dirname, '/views/game.html'));
    } else {
        res.sendFile(__dirname + '/views/index.html');
    }
});

// Route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.sendFile(__dirname + '/views/index.html');
    }
});

// Route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
});

// Starts the server
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});

const players = {};
const usernames = [];
const chatHistory = [];

const db = new Database('./clueless.sqlite3');
const user = new User(db);

user.createTable();

io.on('connection', function (socket) {
    try {
        socket.username = socket.request.session.user;

        if (!usernames.includes(socket.username.toLowerCase())) {
            usernames.push(socket.username.toLowerCase());

            players[socket.username.toLowerCase()] = {
                x: 300,
                y: 300,
                disconnected: false
            };

            const eventMessage = socket.username + ' has joined the game';
            io.sockets.emit('event', eventMessage);
        } else {
            players[socket.username.toLowerCase()].disconnected = false;
        }

        updateUsernames();
        updateChatWindow(socket);


        socket.on('message', function (message) {
            const newMessage = socket.username + ': ' + message;
            console.log('Received message from ' + socket.username + ': ' + message);
            chatHistory.push(newMessage);
            io.sockets.emit('message', newMessage);
        });
        socket.on('movement', function (data) {
            const player = players[socket.username.toLowerCase()] || {};
            if (data.left && player.x >= 5) {
                player.x -= 5;
            }
            if (data.up && player.y >= 5) {
                player.y -= 5;
            }
            if (data.right && player.x <= 595) {
                player.x += 5;
            }
            if (data.down && player.y <= 595) {
                player.y += 5;
            }
        });
        socket.on('disconnect', function () {
            // Remove disconnected player after timeout
            players[socket.username.toLowerCase()].disconnected = true;
            setTimeout(function () {
                if (socket.username.toLowerCase() in players) {
                    if (players[socket.username.toLowerCase()].disconnected) {
                        console.log('Removing player: ' + socket.id + ' - ' + socket.username);
                        usernames.splice(usernames.indexOf(socket.username.toLowerCase()), 1);
                        delete players[socket.username.toLowerCase()];
                        updateUsernames();

                        const eventMessage = socket.username + ' has left the game';
                        io.sockets.emit('event', eventMessage);
                    }
                }
            }, 5000);
        });
    } catch (error) {
        console.log(error.message);
    }
});

function updateUsernames() {
    console.log('Emitting usernames: ' + usernames);
    io.sockets.emit('usernames', usernames);
}

function updateChatWindow(socket) {
    console.log('Emitting chat history');
    socket.emit('chat history', chatHistory);
}

setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);
