const socket = io();
const loginForm = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const canvas = document.getElementById('canvas');
const chatContainer = document.getElementById('chatContainer');
const usernameList = document.getElementById('usernames');
const chatMessages = document.getElementById('chatMessages');
const chatText = document.getElementById('chatText');
const chatSend = document.getElementById('chatSend');
const context = canvas.getContext('2d');

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

password.addEventListener('keyup', function (event) {
    switch (event.keyCode) {
        case 13: // Enter
            loginButton.click();
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

function login() {
    if (username.value && password.value) {
        socket.emit('login', [username.value, password.value], function (result) {
            if (result) {
                loginMessage.innerHTML = '';
                loginForm.classList.add("invisible");
                canvas.classList.remove('invisible');
                chatContainer.classList.remove('invisible');
                usernameList.classList.remove('invisible');
                loginMessage.innerHTML = "";
            } else {
                loginMessage.innerHTML = 'The username or password is incorrect';
            }
        });
    } else {
        loginMessage.innerHTML = 'Please enter a username and password';
    }
    password.value = "";
}

function register() {
    if (username.value && password.value) {
        socket.emit('register', [username.value, password.value], function (result) {
            if (result) {
                loginMessage.innerHTML = '';
                loginForm.classList.add("invisible");
                canvas.classList.remove('invisible');
                chatContainer.classList.remove('invisible');
                usernameList.classList.remove('invisible');
                loginMessage.innerHTML = "";
            } else {
                loginMessage.innerHTML = 'Failed to register user';
            }
        });
    } else {
        loginMessage.innerHTML = 'Please enter a username and password';
    }
    username.value = "";
    password.value = "";
}

function sendChat() {
    if (chatText.value) {
        socket.emit('message', chatText.value);
        chatText.value = "";
    }
}

socket.on('message', function (message) {
    chatMessages.innerHTML += message + '<br/>';
});

socket.on('chat history', function (chatHistory) {
    console.log(chatHistory);
    if (chatHistory && chatHistory.length) {
        chatMessages.innerHTML = chatHistory.join('<br/>');
        chatMessages.innerHTML += '<br/>';
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

socket.on('usernames', function (usernames) {
    console.log(usernames);
    usernameList.innerHTML = '<p>' + usernames.join('<br/>') + '</p>';
});

setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);