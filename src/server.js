// Dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const Database = require('./models/Database');
const User = require('./models/User');
const characters = require('./models/characters');
const Player = require('./models/Player');
const Game = require('./models/Game');
const locations = require('./models/locations');
let timeElapsed = 0;
let clock = null;
let _currentSuggester = -1;
let _currentAccuser = -1;
let _isGameOver = false;

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
            username: req.session.user,
            isGameStarted: isGameStarted
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

            if (!isGameStarted) {
                // Set role of socket to player if game hasn't started yet
                socket.role = 'player';

                // Initialize player properties
                players[socket.username.toLowerCase()] = {
                    disconnected: false,
                    character: null
                };

                // Increment numPlayers
                numPlayers++;

                // Send event message to all sockets
                const eventMessage = socket.username + ' has joined the game';
                io.sockets.emit('event', eventMessage);
            } else {
                // Set role of socket to spectator
                socket.role = 'spectator';

                // Initialize spectator properties
                spectators[socket.username.toLowerCase()] = {
                    disconnected: false
                };

                // Send event message to all sockets
                const eventMessage = socket.username + ' has entered the lobby';
                io.sockets.emit('event', eventMessage);
            }
        } else {
            // Handle page refreshes by re-setting socket role and resetting disconnected boolean
            if (socket.username.toLowerCase() in players) {
                socket.role = 'player';
                players[socket.username.toLowerCase()].disconnected = false;
            } else if (socket.username.toLowerCase() in spectators) {
                socket.role = 'spectator';
                spectators[socket.username.toLowerCase()].disconnected = false;
            }
        }

        // Send username to client
        socket.emit('username', socket.username.toLowerCase());

        updateUsernames();
        updateChatWindow(socket);
        updateGameState(socket);

        // Using this for debugging, print to server console
        socket.on('printToConsole', function(message) {
            console.log('Message from client: ' + message);
        });

        // Move player positions
        socket.on('updatePlayerPosition', function(playerId, newPlayerPos) {
            // Call movePlayer function from game
            console.log('Updating player: ' + playerId + ' position to: ' + newPlayerPos);
            // isMoved = false because simply moving player position
            game.movePlayer(playerId, newPlayerPos, false);
            postToChat(socket.username + ' moved to the ' + location2string(newPlayerPos))
        });

        socket.on('message', function (message) {
            console.log('Received message from ' + socket.username + ': ' + message);

            // Add message to chat history
            const newMessage = socket.username + ': ' + message;
            chatHistory.push(newMessage);

            // Send message to all sockets
            io.sockets.emit('message', newMessage);
        });

        function postToChat(message) {
            chatHistory.push(message);

            // Send message to all sockets
            io.sockets.emit('event', message);
        }

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

                // Send start game message to all sockets
                io.sockets.emit('start game', usernames);
                // Add message to chat history
                postToChat('Let the game begin!');
            }
        });

        socket.on('select character', function (id, callback) {
            // Check if message came from active player in game
            if (socket.role === 'player') {
                // Check if character has been selected already
                for (let player in players) {
                    if (players.hasOwnProperty(player)) {
                        if (player.character === id) {
                            console.log('Character ' + id + ' has already been selected');
                            callback(false);
                        }
                    }
                }

                // Send valid signal back to socket
                callback(true);

                // Initialize character position
                let playerPosition = game.initPlayer(id);
                let _locationMap = game.getLocationMap();

                // Pass position to client
                console.log('Emitting player position to client');
                socket.emit('initPosition', playerPosition, _locationMap);

                numCharsSelected++;

                console.log('Player ' + socket.username + ' selected character ' + id);
                console.log('Player ' + socket.username + ' position: ' + playerPosition);

                players[socket.username.toLowerCase()].character = id;

                // Send character selection to all sockets
                io.sockets.emit('character selected', {
                    'user': socket.username,
                    'id': id
                });

                // If all players have selected characters
                if (numCharsSelected === numPlayers) {
                    console.log('All players have selected characters - dealing cards!');
                    let playerCards = game.dealCards();
                    updatePlayers(playerCards);

                    let turn = game.getFirstTurn();
                    console.log('First turn: ' + turn);
                    io.sockets.emit('player turn', turn);
                    for(let player in players) {
                        if (players[player].character == turn) {
                            postToChat('It\'s ' + player + '\'s turn!');
                            break;
                        }
                    }

                    startServerClock();
                    console.log('Starting timer');
                    io.sockets.emit('update timer');
                }
            } else {
                console.log('Received a select character from a non-player: ' + socket.username);
                callback(false);
            }
        });

        // response to reveal card button clicked
        socket.on('reveal card', function() {
            console.log('Received reveal card for: ' + socket.username);
        });

        // suggestion has been made
        socket.on('suggestion', function(suggester, character, room, weapon) {
            console.log('Suggestion made by: ' + socket.username + ': ' + character +' '+ room +' ' + weapon);
            _currentSuggester = suggester;
            let playerWithCard = game.handleSuggestion(suggester, character, room, weapon);

            if(playerWithCard != null){
               // send player and cards to clients
                io.sockets.emit('request suggestion', playerWithCard, character, room, weapon);
            } else {
                io.sockets.emit('end suggestion', socket.username);
            }

        });

        socket.on('suggestionToServer', function(suggestedCard){
            //receive the card and then send it to the correct client (_currentSuggester)
            io.sockets.emit('show suggestion', _currentSuggester, suggestedCard);
        });

        // Handle accusation
        socket.on('accusation', function(accuserId, charId, roomId, weaponId) {
            console.log('Accusation made by: ' + socket.username + ': ' + charId +' '+ roomId +' ' + weaponId);
            _isGameOver = game.handleAccusation(accuserId, charId, roomId, weaponId);

            // Check
            if(_isGameOver){
                console.log('GAME OVER!!!! ' + socket.username + ' wins ALL the marbles!!');
            }
        });

        socket.on('end turn', function() {
           if (socket.role === 'player') {
               resetServerClock();
               let turn = game.getNextTurn();
               console.log('Next turn: ' + turn);
               io.sockets.emit('player turn', turn);
               startServerClock();
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

                        // Send event message to all sockets
                        const eventMessage = socket.username + ' has left the game';
                        io.sockets.emit('event', eventMessage);

                        // TODO: Game over
                    }
                } else if (socket.username.toLowerCase() in spectators) {
                    if (spectators[socket.username.toLowerCase()].disconnected) {
                        removeClient(socket);

                        // Send event message to all sockets
                        const eventMessage = socket.username + ' has left the lobby';
                        io.sockets.emit('event', eventMessage);
                    }
                }
            }, 1000);   // Timeout is 1 second
        });
    } catch (error) {
        console.log(error.message);
    }
});

function location2string(location){
    switch(location){
        case locations.STUDY:
            return 'Study hall';
        case locations.HALLWAY_STUDY_HALL:
            return 'hallway between study and hall';
        case locations.HALL:
            return 'hall';
        case locations.HALLWAY_HALL_LOUNGE:
            return 'hallway between hall and lounge';
        case locations.LOUNGE:
            return 'lounge';
        case locations.HALLWAY_STUDY_LIBRARY:
            return 'hallway between study and library';
        case locations.HALLWAY_HALL_BILLIARD:
            return 'hallway between hall and billiard';
        case locations.HALLWAY_LOUNGE_DINING:
            return 'hallway between lounge and dining room';
        case locations.LIBRARY:
            return 'library';
        case locations.HALLWAY_LIBRARY_BILLIARD:
            return 'hallway between library and billiard';
        case locations.BILLIARD_ROOM:
            return 'billiard room';
        case locations.HALLWAY_BILLIARD_DINING:
            return 'hallway between billiard and dining room';
        case locations.DINING_ROOM:
            return 'dining room';
        case locations.HALLWAY_LIBRARY_CONSERVATORY:
            return 'hallway between library and conservatory';
        case locations.HALLWAY_BILLIARD_BALLROOM:
            return 'hallway between billiard and ballroom';
        case locations.HALLWAY_DINING_KITCHEN:
            return 'hallway between dining room and kitchen';
        case locations.CONSERVATORY:
            return 'conservatory';
        case locations.HALLWAY_CONSERVATORY_BALLROOM:
            return 'hallway between conservatory and ballroom';
        case locations.BALLROOM:
            return 'ballroom';
        case locations.HALLWAY_BALLROOM_KITCHEN:
            return 'hallway between ballroom and kitchen';
        case locations.KITCHEN:
            return 'kitchen';
    }
}

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
    socket.emit('game state', {
        'isStarted': isGameStarted,
        'turn': game.getTurn(),
        'players': players
    });
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

function updateTimer(max_time) {
    //send timer update to all clients
    io.sockets.emit('timer', max_time - ++timeElapsed);
    if (game.updateTimer(timeElapsed)) {
        // time is up for the turn, reset everyone's timer
        io.sockets.emit('timer', 0);
        resetServerClock();
        let turn = game.getNextTurn();
        console.log('Next turn: ' + turn);
        io.sockets.emit('player turn', turn);
        startServerClock();
    }
}

function startServerClock() {
    console.log('Starting server clock');
    clock = setInterval(function () {
        // update the timers every one second
        updateTimer(game.MAX_TIME);
    }, 1000); // set to 10000 for development purposes, reset when ready
}

function resetServerClock() {
    console.log('Reset server clock to 0');
    clearInterval(clock);
    timeElapsed = 0;
}
