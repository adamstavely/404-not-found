const socket = io();
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startButton');
const usernameList = document.getElementById('usernames');
const chatWindow = document.getElementById('chatMessagesWrapper');
const chatMessages = document.getElementById('chatMessages');
const chatText = document.getElementById('chatText');
const chatSend = document.getElementById('chatSend');
const context = canvas.getContext('2d');
//const Player = require('../models/Player');
let myUsername = '';
let character = null;

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
    console.log(choice);
    if (choice) {
        socket.emit('select character', choice, function (result) {
            if (result) {
                character = choice;
                $('#modalCharacterSelect').modal('hide');
            }
        });
    } else {
        alert('You must select a character');
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
    myUsername = username;
});

socket.on('usernames', function (usernames) {
    console.log(usernames);
    usernameList.innerHTML = '<p>' + usernames.join('<br/>') + '</p>';
    // TODO: Uncomment check for number of users
    // if (usernames.length >= 3) {
    startButton.removeAttribute('disabled');
    // }
});

socket.on('players', function (humanArr) {
    // emit the deck for the current player
    console.log(humanArr);
});

socket.on('game state', function (isGameStarted, players) {
    console.log('Received game state from server: ' + isGameStarted);
    if (isGameStarted) {
        overlay.parentNode.removeChild(overlay);
        if (players && myUsername in players) {
            // TODO: Store character selections
            if (!players[myUsername].character) {
                $('#modalCharacterSelect').modal({backdrop: 'static', keyboard: false});
            }
        } else {
            chatMessages.innerHTML += '<i>Game has already begun</i><br/>';
        }
    }
});

socket.on('start game', function (usernames) {
    console.log('Game has started with ' + usernames.length + ' players');
    overlay.parentNode.removeChild(overlay);
    $('#modalCharacterSelect').modal({backdrop: 'static', keyboard: false});
});

socket.on('character selected', function (id) {
    const input = $('input[name=characterSelect][value=' + id + ']');
    input.prop('disabled', true);
    input.prop('checked', false);
    console.log('Character ' + id + ' has been selected');
});


setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);
