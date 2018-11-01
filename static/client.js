const socket = io();
const loginForm = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const usernameList = document.getElementById('usernames');

canvas.width = 800;
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
        case 13: // Enter
            loginButton.click();
    }
});

function login() {
    if (username.value && password.value) {
        socket.emit('login', [username.value, password.value], function (result) {
            if (result) {
                loginMessage.innerHTML = '';
                loginForm.classList.add("invisible");
                canvas.classList.remove('invisible');
                usernames.classList.remove('invisible');
                loginMessage.innerHTML = "";
            } else {
                loginMessage.innerHTML = 'The username or password is incorrect';
            }
        });
    } else {
        loginMessage.innerHTML = 'Please enter a username and password';
    }
    username.value = "";
    password.value = "";
}

function register() {
    if (username.value && password.value) {
        socket.emit('register', [username.value, password.value], function (result) {
            if (result) {
                loginMessage.innerHTML = '';
                loginForm.classList.add("invisible");
                canvas.classList.remove('invisible');
                usernames.classList.remove('invisible');
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

socket.on('message', function (data) {
    console.log(data);
});

socket.on('state', function (players) {
    context.clearRect(0, 0, 800, 600);
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