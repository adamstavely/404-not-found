const socket = io();
const overlay = document.getElementById('overlay');
const playerWrappers = document.getElementsByClassName('playerWrapper');
const playerLabels = document.getElementsByClassName('playerLabel');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startButton');
const usernameList = document.getElementById('usernames');
const chatWindow = document.getElementById('chatMessagesWrapper');
const chatMessages = document.getElementById('chatMessages');
const chatText = document.getElementById('chatText');
const chatSend = document.getElementById('chatSend');
const timer = document.getElementById('timer');
const context = canvas.getContext('2d');

let isGameStarted = false;
let _player = null;
let _username = '';
let _character = null;
let _currentTurn = 0;
let timerObj = null;
let timeElapsed = 0;

canvas.width = 600;
canvas.height = 600;

// Add event listener for sending chat messages
chatText.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 13: // Enter
            // Override default behavior
            event.preventDefault();

            // Send chat message
            chatSend.click();
            break;
    }
});

function sendChat() {
    if (chatText.value) {
        // Send chat message to server
        socket.emit('message', chatText.value);

        // Clear text box
        chatText.value = "";
    }
}

function startGame() {
    // Send start game message to server
    socket.emit('start game');
}

function selectCharacter() {
    // Get choice from radio buttons
    const choice = $('input[name=characterSelect]:checked').val();

    // Check if a character has been selected
    if (choice) {
        // Send character selection to server
        socket.emit('select character', parseInt(choice), function (result) {
            if (result) {
                // Set local character to the choice
                _character = parseInt(choice);

                // Hide character select window
                $('#modalCharacterSelect').modal('hide');
            }
        });
    } else {
        alert('You must select a character');
    }
}

function movePlayer() {
    console.log('Move player');
}

function makeSuggestion() {
    console.log('Make suggestion');
}

function revealCard() {
    console.log('Reveal card');
}

function makeAccusation() {
    console.log('Make accusation');
}

function endTurn() {
    // Check if it is my turn
    if (_currentTurn === _character) {
        // Send end turn message to server
        socket.emit('end turn');
        // Set timer to 0
        timer.innerHTML = '0';
    } else {
        console.log('It is not your turn!');
    }
}

function scrollToBottom() {
    // Scroll chat window to the bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

socket.on('message', function (message) {
    // Append new message to the chat window
    chatMessages.innerHTML += message + '<br/>';
    scrollToBottom();
});

socket.on('event', function (eventMessage) {
    // Append new event message to the chat window
    chatMessages.innerHTML += '<i>' + eventMessage + '</i><br/>';
    scrollToBottom();
});

socket.on('chat history', function (chatHistory) {
    console.log(chatHistory);
    // Append the chat history to the chat window
    if (chatHistory && chatHistory.length) {
        chatMessages.innerHTML = chatHistory.join('<br/>');
        chatMessages.innerHTML += '<br/>';
        scrollToBottom();
    }
});

socket.on('state', function (players) {
    context.clearRect(0, 0, 600, 600);
    context.fillStyle = 'green';
    for (let id in players) {
        if (players.hasOwnProperty(id)) {
            let player = players[id];
            context.beginPath();
            context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
            context.fill();
        }
    }
});

socket.on('username', function (username) {
    // Set local username
    _username = username;
});

socket.on('usernames', function (usernames) {
    console.log(usernames);
    // Append usernames to the username list
    usernameList.innerHTML = '<p>' + usernames.join('<br/>') + '</p>';
    // TODO: Uncomment check for number of users
    // Check for minimum number of characters to start the game
    // if (usernames.length >= 3) {
    if (startButton) {
        startButton.removeAttribute('disabled');
    }
    // }
});

socket.on('players', function (humanArr) {
    // Receive the deck for the current player
    console.log(humanArr);
    for (let i = 0; i < humanArr.length; i++) {
        if (_character === humanArr[i].id) {
            // Set current player properties
            _player = humanArr[i];
        }
    }
});

socket.on('game state', function (game) {
    console.log('Received game state from server: ' + game.isStarted);
    console.log('Current turn: ' + game.turn);

    // Receive initial values for the game
    isGameStarted = game.isStarted;
    _currentTurn = game.turn;

    if (game.isStarted) {
        if (overlay) {
            // Remove overlay if game has been started
            overlay.parentNode.removeChild(overlay);
        }

        // Set the marker for the current turn
        for (let i = 0; i < playerWrappers.length; i++) {
            if (i !== _currentTurn) {
                playerWrappers[i].style.border = 'none';
            } else {
                playerWrappers[i].style.border = '2px solid black';
            }
        }

        // Set the usernames for the characters
        for (let player in game.players) {
            if (game.players.hasOwnProperty(player)) {
                playerLabels[game.players[player].character].innerHTML = player;
            }
        }

        // Check if client is a player in the game
        if (game.players && _username in game.players) {
            // Check if player has selected character already
            if (!game.players[_username].character) {
                for (let player in game.players) {
                    if (game.players.hasOwnProperty(player)) {
                        if (game.players[player].character != null) {
                            const input = $('input[name=characterSelect][value=' + game.players[player].character + ']');
                            input.prop('disabled', true);
                            input.prop('checked', false);
                        }
                    }
                }
                $('#modalCharacterSelect').modal({backdrop: 'static', keyboard: false});
            } else {
                // Set local character ID
                _character = game.players[_username].character;
            }

            // Enable/disable buttons based on current turn
            $('.action').each(function () {
                $(this).prop('disabled', !(_currentTurn === _character));
            });
        } else {
            chatMessages.innerHTML += '<i>Game has already begun</i><br/>';
        }
    }
});

socket.on('start game', function (usernames) {
    if (!isGameStarted) {
        console.log('Game has started with ' + usernames.length + ' players');

        // Remove start game overlay
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }

        // Show the character select window
        $('#modalCharacterSelect').modal({backdrop: 'static', keyboard: false});
    }
});

socket.on('character selected', function (character) {
    // Disable the input for the selected character
    const input = $('input[name=characterSelect][value=' + character.id + ']');
    input.prop('disabled', true);
    input.prop('checked', false);

    // Set username for selected character
    playerLabels[character.id].innerHTML = character.user;

    console.log('Character ' + character.id + ' has been selected');
});

socket.on('player turn', function (id) {
    console.log('Current player turn: ' + id);

    // Set current turn
    _currentTurn = id;

    // Set the marker for the current turn
    for (let i = 0; i < playerWrappers.length; i++) {
        if (i !== _currentTurn) {
            playerWrappers[i].style.border = 'none';
        } else {
            playerWrappers[i].style.border = '2px solid black';
        }
    }

    // Enable/disable buttons based on current turn
    $('.action').each(function () {
        $(this).prop('disabled', !(_currentTurn === _character));
    });
});

/*socket.on('timer', function (timeout) {
    console.log('Client timer started with ' + timeout / 1000 + ' seconds');
    timerObj = setInterval(function(){
        timer.innerHTML = timeout/1000 - ++timeElapsed;
        if(timeElapsed >= timeout / 1000) {
            clearInterval(timerObj);
            console.log('Client timer ended');
        }
    },1000);
}); */

socket.on('timer', function (timeElapsed) {
    timer.innerHTML = timeElapsed;
});
