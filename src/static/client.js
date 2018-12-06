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
let _playerCards = {};
let timerObj = null;
let timeElapsed = 0;
let isAccusation = false;

// Variables for suggestions and accusations
let _suggestedChar = null;
let _suggestedRoom = null;
let _suggestedWeapon = null;
let _accusedChar = null;
let _accusedRoom = null;
let _accusedWeapon = null;
// @TODO: add some array to track what has been accused/suggested
// EITHER HERE OR THE SERVER AND RETURNED HERE

// Booleans for cards in the deck
let hasMissScarlett = false;
let hasColMustard = false;
let hasMrsWhite = false;
let hasMrGreen = false;
let hasMrsPeacock = false;
let hasProfPlum = false;
let hasKitchen = false;
let hasBallroom = false;
let hasConservatory = false;
let hasDiningRoom = false;
let hasBilliard = false;
let hasLibrary = false;
let hasLounge = false;
let hasHall = false;
let hasStudy = false;
let hasCandlestick = false;
let hasDagger = false;
let hasLead = false;
let hasRevolver = false;
let hasRope = false;
let hasSpanner = false;

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

// testing showing cards functionality
function showCards(){
    $('#modalPlayerCards').modal('hide');
    console.log('Cards showed to player');
}

function movePlayer() {
    console.log('Move player');
}

function makeSuggestion() {
    if(!isAccusation){
        console.log('Make suggestion');
    }

    // Enable all character cards and choose char
    for(let charIdx=0; charIdx<6; charIdx++){
        const charCard = $('input[name=charCardSelect][value=' + charIdx + ']');

        // @TODO if it hasn't been suggested/accused yet
        charCard.prop('disabled', false);
        charCard.prop('checked', false);
    }

    // Make dialog visible
    $('#modalCharacterCards').modal({backdrop: 'static', keyboard: false});
}

// Choose room card
function chooseRoomCard(){
    // First retrieve character card selected
    const testChoice = $('input[name=charCardSelect]:checked').val();
    if (testChoice) {
        if(!isAccusation){
            _suggestedChar = parseInt(testChoice);
            console.log('Suggested character: ' + _suggestedChar);
        } else {
            _accusedChar = parseInt(testChoice);
            console.log('Accused character: ' + _accusedChar);
        }

        $('#modalCharacterCards').modal('hide');
    }

    console.log('Choose a room');

    // Enable all room cards and choose room
    for(let roomIdx=6; roomIdx<15; roomIdx++){
        const roomCard = $('input[name=roomCardSelect][value=' + roomIdx + ']');

        // @TODO if it hasn't been suggested/accused yet
        roomCard.prop('disabled', false);
        roomCard.prop('checked', false);
    }

    // Make dialog visible
    $('#modalRoomCards').modal({backdrop: 'static', keyboard: false});
}

// Choose weapon card
function chooseWeaponCard(){
    // Pull down room selected
    const testChoice = $('input[name=roomCardSelect]:checked').val();
    if (testChoice) {
        if(!isAccusation){
            _suggestedRoom = parseInt(testChoice);
            console.log('Suggested room: ' + _suggestedRoom);
        } else {
            _accusedRoom = parseInt(testChoice);
            console.log('Accused room: ' + _accusedRoom);
        }

        $('#modalRoomCards').modal('hide');
    }

    console.log('Choose a weapon');

    // Enable all room cards and choose room
    for(let weapIdx=15; weapIdx<21; weapIdx++){
        const weaponCard = $('input[name=weaponCardSelect][value=' + weapIdx + ']');

        // @TODO if it hasn't been suggested/accused yet
        weaponCard.prop('disabled', false);
        weaponCard.prop('checked', false);
    }

    // Make dialog visible
    $('#modalWeaponCards').modal({backdrop: 'static', keyboard: false});
}

function endSuggestion(){
    // Pull down selected weapon
    const testChoice = $('input[name=weaponCardSelect]:checked').val();
    if (testChoice) {
        if(!isAccusation){
            _suggestedWeapon = parseInt(testChoice);
            console.log('Suggested weapon: ' + _suggestedWeapon);
        } else {
            _accusedWeapon = parseInt(testChoice);
            console.log('Accused weapon: ' + _accusedWeapon);
        }

        $('#modalWeaponCards').modal('hide');
    }

    // Kick off back end processing
    if(!isAccusation){
        console.log('Suggestion made for char: ' + _suggestedChar);
        console.log('Suggestion made for room: ' + _suggestedRoom);
        console.log('Suggestion made for weapon: ' + _suggestedWeapon);

        // @TODO: Kick off processing of suggestion
        // use socket.emit to pass it off to server
    } else {
        console.log('Accusation made for char: ' + _accusedChar);
        console.log('Accusation made for room: ' + _accusedRoom);
        console.log('Accusation made for weapon: ' + _accusedWeapon);

        // @TODO: Kick off processing of accusation
        // use socket.emit to pass it off to server
    }

    // Reset isAccusation
    isAccusation = false;

}

function revealCard() {
    console.log('Select card to reveal!');
    $('#modalPlayerCards').modal({backdrop: 'static', keyboard: false});

    // Store selected card
    const choice = $('input[name=cardSelect]:checked').val();
    if(choice){
        console.log('Chose card: ' + choice);
        $('#modalPlayerCards').modal('hide');
        // Call reveal card
    }
}

function makeAccusation() {
    console.log('Make accusation');

    // Use same logic as makeSuggestion();
    isAccusation = true;
    makeSuggestion();

    // After it returns, reset accusation
    //isAccusation = false;
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

// This handles the cards being dealt to each player
socket.on('players', function (humanArr) {
    // Receive the deck for the current player
    console.log(humanArr);
    for (let i = 0; i < humanArr.length; i++) {
        if (_character === humanArr[i].id) {
            // Set current player properties
            _player = humanArr[i];
            //socket.emit('printToConsole', "Active player: " + _player.id);
            _playerCards = humanArr[i].cards;
            socket.emit('printToConsole', "Card length: " + _playerCards.length);
        }
    }

    // Check what cards player has
    for(let j=0; j<_playerCards.length; j++){
        console.log(_playerCards[j].name);
        // disable all cards by default
        const testCard = $('input[name=cardSelect][value=' + _playerCards[j].name + ']');

        switch(_playerCards[j].name) {
            case 0:
                hasMissScarlett = true;
                testCard.prop('disabled', false);
                break;
            case 1:
                hasColMustard = true;
                testCard.prop('disabled', false);
                break;
            case 2:
                hasMrsWhite = true;
                testCard.prop('disabled', false);
                break;
            case 3:
                hasMrGreen = true;
                testCard.prop('disabled', false);
                break;
            case 4:
                hasMrsPeacock = true;
                testCard.prop('disabled', false);
                break;
            case 5:
                hasProfPlum = true;
                testCard.prop('disabled', false);
                break;
            case 6:
                hasKitchen = true;
                testCard.prop('disabled', false);
                break;
            case 7:
                hasBallroom = true;
                testCard.prop('disabled', false);
                break;
            case 8:
                hasConservatory = true;
                testCard.prop('disabled', false);
                break;
            case 9:
                hasDiningRoom = true;
                testCard.prop('disabled', false);
                break;
            case 10:
                hasBilliard = true;
                testCard.prop('disabled', false);
                break;
            case 11:
                hasLibrary = true;
                testCard.prop('disabled', false);
                break;
            case 12:
                hasLounge = true;
                testCard.prop('disabled', false);
                break;
            case 13:
                hasHall = true;
                testCard.prop('disabled', false);
                break;
            case 14:
                hasStudy = true;
                testCard.prop('disabled', false);
                break;
            case 15:
                hasCandlestick = true;
                testCard.prop('disabled', false);
                break;
            case 16:
                hasDagger = true;
                testCard.prop('disabled', false);
                break;
            case 17:
                hasLead = true;
                testCard.prop('disabled', false);
                break;
            case 18:
                hasRevolver = true;
                testCard.prop('disabled', false);
                break;
            case 19:
                hasRope = true;
                testCard.prop('disabled', false);
                break;
            case 20:
                hasSpanner = true;
                testCard.prop('disabled', false);
                break;
        }
    }

    // Show cards
    $('#modalPlayerCards').modal({backdrop: 'static', keyboard: false});
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
