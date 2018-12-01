// Dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const Database = require('./models/database');
const User = require('./models/user');
const characters = require('./models/characters');
const Player = require('./models/Player');
const Game = require('./models/Game');

// Create the server
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const sessionMiddleware = session({
    key: 'user_sid',
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: false
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
        res.render('index');
    });

// Route for main game
app.get('/game', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.render('game', {
            username: req.session.user
        });
    } else {
        res.render('index');
    }
});

// Route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.render('index');
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

const usernames = [];
const players = {};
const spectators = {};
const chatHistory = [];

let isGameStarted = false;
let numPlayers = 0;
let numCharsSelected = 0;

const db = new Database('./clueless.sqlite3');
const user = new User(db);
const game = new Game();

user.createTable();

io.on('connection', function (socket) {
    try {
        socket.username = socket.request.session.user;

        if (!usernames.includes(socket.username.toLowerCase())) {
            // Add username to list of global usernames
            usernames.push(socket.username.toLowerCase());

            // Only add player to game if game hasn't started yet
            if (!isGameStarted) {
                socket.role = 'player';
                players[socket.username.toLowerCase()] = {
                    x: 300,
                    y: 300,
                    disconnected: false,
                    character: null
                };

                // Increment numPlayers
                numPlayers++;

                const eventMessage = socket.username + ' has joined the game';
                io.sockets.emit('event', eventMessage);
            } else {
                socket.role = 'spectator';
                spectators[socket.username.toLowerCase()] = {
                    disconnected: false
                };

                const eventMessage = socket.username + ' has entered the lobby';
                io.sockets.emit('event', eventMessage);
            }
        } else {
            if (socket.username.toLowerCase() in players) {
                players[socket.username.toLowerCase()].disconnected = false;
            } else if (socket.username.toLowerCase() in spectators) {
                spectators[socket.username.toLowerCase()].disconnected = false;
            }
        }

        socket.emit('username', socket.username.toLowerCase());

        updateUsernames();
        updateChatWindow(socket);
        updateGameState(socket);

        socket.on('message', function (message) {
            const newMessage = socket.username + ': ' + message;
            console.log('Received message from ' + socket.username + ': ' + message);
            chatHistory.push(newMessage);
            io.sockets.emit('message', newMessage);
        });
        socket.on('start game', function () {
            // TODO: Change check to 3
            // Check that there are enough players
            if (numPlayers < 1) {
                console.log('Cannot start game yet...not enough players!');
            } else {
                console.log('Start game initiated by ' + socket.username);

                // Initialize game
                game.setNumPlayers(numPlayers);
                game.initDeck();

                isGameStarted = true;
                io.sockets.emit('start game', usernames);
            }
        });
        socket.on('select character', function (id, callback) {
            if (socket.role === 'player') {
                for (let player in players) {
                    if (players.hasOwnProperty(player)) {
                        if (player.character === id) {
                            console.log('Character ' + id + ' has already been selected');
                            callback(false);
                        }
                    }
                }

                // Initialize character position
                let playerPosition = game.initPlayer(id);
                numCharsSelected++;

                console.log('Player ' + socket.username + ' selected character ' + id);
                console.log('Player ' + socket.username + ' position: ' + playerPosition);

                players[socket.username.toLowerCase()].character = id;
                io.sockets.emit('character selected', id);

                // If all players have selected characters
                if (numCharsSelected === numPlayers) {
                    console.log('All players have selected characters - dealing cards!');
                    let playerCards = game.dealCards();
                    updatePlayers(playerCards);
                }
                
                callback(true);
            } else {
                console.log('Received a select character from a non-player: ' + socket.username);
                callback(false);
            }
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
            if (socket.username.toLowerCase() in players) {
                players[socket.username.toLowerCase()].disconnected = true;
            } else if (socket.username.toLowerCase() in spectators) {
                spectators[socket.username.toLowerCase()].disconnected = true;
            }

            setTimeout(function () {
                if (socket.username.toLowerCase() in players) {
                    if (players[socket.username.toLowerCase()].disconnected) {
                        removeClient(socket);

                        // Decrement numPlayers
                        numPlayers--;

                        const eventMessage = socket.username + ' has left the game';
                        io.sockets.emit('event', eventMessage);
                    }
                } else if (socket.username.toLowerCase() in spectators) {
                    if (spectators[socket.username.toLowerCase()].disconnected) {
                        removeClient(socket);

                        const eventMessage = socket.username + ' has left the lobby';
                        io.sockets.emit('event', eventMessage);
                    }
                }
            }, 1000);
        });
    } catch (error) {
        console.log(error.message);
    }
});

function updateUsernames() {
    console.log('Emitting usernames: ' + usernames);
    io.sockets.emit('usernames', usernames);
}

function updatePlayers(playerCards) {
    console.log('Emitting players');
    io.sockets.emit('players', playerCards);
}

function updateChatWindow(socket) {
    console.log('Emitting chat history');
    socket.emit('chat history', chatHistory);
}

function updateGameState(socket) {
    console.log('Emitting game state');
    socket.emit('game state', isGameStarted, players);
}

function removeClient(socket) {
    console.log('Removing player: ' + socket.id + ' - ' + socket.username);
    usernames.splice(usernames.indexOf(socket.username.toLowerCase()), 1);
    if (socket.role === 'player') {
        delete players[socket.username.toLowerCase()];
    } else if (socket.role === 'spectator') {
        delete spectators[socket.username.toLowerCase()];
    }
    updateUsernames();
}

setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);
