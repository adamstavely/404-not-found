const socket = io();
const overlay = document.getElementById('overlay');
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

const movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

document.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 65: // A
            movement.left = true;
            break;
        case 87: // W
            movement.up = true;
            break;
        case 68: // D
            movement.right = true;
            break;
        case 83: // S
            movement.down = true;
            break;
    }
});

document.addEventListener('keyup', function (event) {
    switch (event.keyCode) {
        case 65: // A
            movement.left = false;
            break;
        case 87: // W
            movement.up = false;
            break;
        case 68: // D
            movement.right = false;
            break;
        case 83: // S
            movement.down = false;
            break;
    }
});

chatText.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 13: // Enter
            event.preventDefault();
            chatSend.click();
            break;
    }
});

function sendChat() {
    if (chatText.value) {
        socket.emit('message', chatText.value);
        chatText.value = "";
    }
}

function startGame() {
    socket.emit('start game');
}

function selectCharacter() {
    const choice = $('input[name=characterSelect]:checked').val();
    if (choice) {
        socket.emit('select character', parseInt(choice), function (result) {
            if (result) {
                _character = parseInt(choice);
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
    if (_currentTurn === _character) {
        socket.emit('end turn');
        timer.innerHTML = '0';
    } else {
        console.log('It is not your turn!');
    }
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

socket.on('message', function (message) {
    chatMessages.innerHTML += message + '<br/>';
    scrollToBottom();
});

socket.on('event', function (eventMessage) {
    chatMessages.innerHTML += '<i>' + eventMessage + '</i><br/>';
    scrollToBottom();
});

socket.on('chat history', function (chatHistory) {
    console.log(chatHistory);
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
    _username = username;
});

socket.on('usernames', function (usernames) {
    console.log(usernames);
    usernameList.innerHTML = '<p>' + usernames.join('<br/>') + '</p>';
    // TODO: Uncomment check for number of users
    // if (usernames.length >= 3) {
    if (startButton) {
        startButton.removeAttribute('disabled');
    }
    // }
});

socket.on('players', function (humanArr) {
    // emit the deck for the current player
    console.log(humanArr);
    for (let i = 0; i < humanArr.length; i++) {
        if (_character === humanArr[i].id) {
            _player = humanArr[i];
        }
    }
});

socket.on('game state', function (game) {
    console.log('Received game state from server: ' + game.isStarted);
    console.log('Current turn: ' + game.turn);
    isGameStarted = game.isStarted;
    _currentTurn = game.turn;
    if (game.isStarted) {
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }
        if (game.players && _username in game.players) {
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
                _character = game.players[_username].character;
            }
        } else {
            chatMessages.innerHTML += '<i>Game has already begun</i><br/>';
        }
    }
});

socket.on('start game', function (usernames) {
    if (!isGameStarted) {
        console.log('Game has started with ' + usernames.length + ' players');
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }
        $('#modalCharacterSelect').modal({backdrop: 'static', keyboard: false});
    }
});

socket.on('character selected', function (id) {
    const input = $('input[name=characterSelect][value=' + id + ']');
    input.prop('disabled', true);
    input.prop('checked', false);
    console.log('Character ' + id + ' has been selected');
});

socket.on('player turn', function (id) {
    console.log('Current player turn: ' + id);
    _currentTurn = id;
    let isMyTurn = false;
    if (_currentTurn === _character) {
        $('#modalTurnNotification').modal('show');
        isMyTurn = true;
    }
    $('.action').each(function () {
        $(this).prop('disabled', !isMyTurn);
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

setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);
