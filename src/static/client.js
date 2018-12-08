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
let isAccusation = false;
let isSuggestion = false;
let _locationMap = {};
let _playerPosition = 0;
let animationTimer = null;
let tempX = 0;
let tempY = 0;
// Variables for suggestions and accusations
let _suggestedChar = null;
let _suggestedRoom = null;
let _suggestedWeapon = null;
let _accusedChar = null;
let _accusedRoom = null;
let _accusedWeapon = null;
// @TODO: add some array to track what has been accused/suggested
// EITHER HERE OR THE SERVER AND RETURNED HERE

canvas.width = 600;
canvas.height = 600;

const LOCATIONS = {
    STUDY: 1,
    HALLWAY_STUDY_HALL: 2,
    HALL: 3,
    HALLWAY_HALL_LOUNGE: 4,
    LOUNGE: 5,
    HALLWAY_STUDY_LIBRARY: 6,
    HALLWAY_HALL_BILLIARD: 7,
    HALLWAY_LOUNGE_DINING: 8,
    LIBRARY: 9,
    HALLWAY_LIBRARY_BILLIARD: 10,
    BILLIARD_ROOM: 11,
    HALLWAY_BILLIARD_DINING: 12,
    DINING_ROOM: 13,
    HALLWAY_LIBRARY_CONSERVATORY: 14,
    HALLWAY_BILLIARD_BALLROOM: 15,
    HALLWAY_DINING_KITCHEN: 16,
    CONSERVATORY: 17,
    HALLWAY_CONSERVATORY_BALLROOM: 18,
    BALLROOM: 19,
    HALLWAY_BALLROOM_KITCHEN: 20,
    KITCHEN: 21,
    SPAWN_SCARLET: 22,
    SPAWN_MUSTARD: 23,
    SPAWN_WHITE: 24,
    SPAWN_GREEN: 25,
    SPAWN_PEACOCK: 26,
    SPAWN_PLUM: 27
};

const LOCATION_MAP = {
    1: [LOCATIONS.HALLWAY_STUDY_HALL, LOCATIONS.HALLWAY_STUDY_LIBRARY, LOCATIONS.KITCHEN],
    2: [LOCATIONS.STUDY, LOCATIONS.HALL],
    3: [LOCATIONS.HALLWAY_STUDY_HALL, LOCATIONS.HALLWAY_HALL_LOUNGE, LOCATIONS.HALLWAY_HALL_BILLIARD],
    4: [LOCATIONS.HALL, LOCATIONS.LOUNGE],
    5: [LOCATIONS.HALLWAY_HALL_LOUNGE, LOCATIONS.HALLWAY_LOUNGE_DINING, LOCATIONS.CONSERVATORY],
    6: [LOCATIONS.STUDY, LOCATIONS.LIBRARY],
    7: [LOCATIONS.HALL, LOCATIONS.BILLIARD_ROOM],
    8: [LOCATIONS.LOUNGE, LOCATIONS.DINING_ROOM],
    9: [LOCATIONS.HALLWAY_STUDY_LIBRARY, LOCATIONS.HALLWAY_LIBRARY_BILLIARD, LOCATIONS.HALLWAY_LIBRARY_CONSERVATORY],
    10: [LOCATIONS.LIBRARY, LOCATIONS.BILLIARD_ROOM],
    11: [LOCATIONS.HALLWAY_HALL_BILLIARD, LOCATIONS.HALLWAY_LIBRARY_BILLIARD, LOCATIONS.HALLWAY_BILLIARD_DINING, LOCATIONS.HALLWAY_BILLIARD_BALLROOM],
    12: [LOCATIONS.BILLIARD_ROOM, LOCATIONS.DINING_ROOM],
    13: [LOCATIONS.HALLWAY_LOUNGE_DINING, LOCATIONS.HALLWAY_BILLIARD_DINING, LOCATIONS.HALLWAY_DINING_KITCHEN],
    14: [LOCATIONS.LIBRARY, LOCATIONS.CONSERVATORY],
    15: [LOCATIONS.BILLIARD_ROOM, LOCATIONS.BALLROOM],
    16: [LOCATIONS.DINING_ROOM, LOCATIONS.KITCHEN],
    17: [LOCATIONS.LOUNGE, LOCATIONS.HALLWAY_LIBRARY_CONSERVATORY, LOCATIONS.HALLWAY_CONSERVATORY_BALLROOM],
    18: [LOCATIONS.CONSERVATORY, LOCATIONS.BALLROOM],
    19: [LOCATIONS.HALLWAY_BILLIARD_BALLROOM, LOCATIONS.HALLWAY_CONSERVATORY_BALLROOM, LOCATIONS.HALLWAY_BALLROOM_KITCHEN],
    20: [LOCATIONS.BALLROOM, LOCATIONS.KITCHEN],
    21: [LOCATIONS.STUDY, LOCATIONS.HALLWAY_DINING_KITCHEN, LOCATIONS.HALLWAY_BALLROOM_KITCHEN],
    22: [LOCATIONS.HALLWAY_HALL_LOUNGE],
    23: [LOCATIONS.HALLWAY_LOUNGE_DINING],
    24: [LOCATIONS.HALLWAY_BALLROOM_KITCHEN],
    25: [LOCATIONS.HALLWAY_CONSERVATORY_BALLROOM],
    26: [LOCATIONS.HALLWAY_LIBRARY_CONSERVATORY],
    27: [LOCATIONS.HALLWAY_STUDY_LIBRARY]
};

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

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
    // get choice from buttons
    const choice = $('input[name=cardSelect]:checked').val();

    // check if a character has been selected
    if(isSuggestion){
        if(choice){
            // figure out the card to be suggested
            suggestedCard = parseInt(choice);
            $('#modalPlayerCards').modal('hide');

            console.log('Emitting suggested card to server');
            socket.emit('suggestionToServer', suggestedCard);

            // reset flag
            isSuggestion = false;
        }
    } else {
        $('#modalPlayerCards').modal('hide');
        console.log('Cards showed to player');
    }

}

// Called upon move btn click
function movePlayer() {
    console.log('Move player');

    // Pop up dialog box
    let modalMoveBody = document.getElementById('modalMoveBody');
    modalMoveBody.innerHTML = "";

    for (let i = 0; i < LOCATION_MAP[_playerPosition].length; i++) {
        console.log(LOCATION_MAP[_playerPosition][i]);
        modalMoveBody.innerHTML += "<label><input type='checkbox' name='moveRoomCheckbox' value='"
            + LOCATION_MAP[_playerPosition][i] + "'>" + getKeyByValue(LOCATIONS, LOCATION_MAP[_playerPosition][i])
            + "</label><br>";
    }

    $('#modalMove').modal('show');
}

// Function for ending movePlayer
function endMove(){
    // Retrieve selection
    const moveChoice = $('input[name=moveRoomCheckbox]:checked').val();
    if(moveChoice){
        console.log('Player moving to: ' + parseInt(moveChoice));

        $('#modalMove').modal('hide');

        // Set new playerPosition
        _playerPosition = parseInt(moveChoice);
        console.log('New player position: ' + _playerPosition);
        // @TODO probably need to emit this to the server
        socket.emit('updatePlayerPosition', _player.id, _playerPosition);

        // Check if in hallway, disable suggestBtn
        if(_playerPosition == 2  ||
           _playerPosition == 4  ||
           _playerPosition == 6  ||
           _playerPosition == 7  ||
           _playerPosition == 8  ||
           _playerPosition == 10 ||
           _playerPosition == 12 ||
           _playerPosition == 14 ||
           _playerPosition == 15 ||
           _playerPosition == 16 ||
           _playerPosition == 18 ||
           _playerPosition == 20) {
               const disableBtn = $('button[name=suggestBtn]');
               disableBtn.prop('disabled', true);
        }
    } else {

    }
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
    $('#modalCharacterCards').modal('show');
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
    if(!isAccusation){
        _suggestedRoom = _playerPosition;
        chooseWeaponCard();

    }  else {
        for(let roomIdx=6; roomIdx<15; roomIdx++){
            const roomCard = $('input[name=roomCardSelect][value=' + roomIdx + ']');

        // @TODO if it hasn't been suggested/accused yet
            roomCard.prop('disabled', false);
            roomCard.prop('checked', false);
          }

    // Make dialog visible
    $('#modalRoomCards').modal('show');
  }
}

// Choose weapon card
function chooseWeaponCard(){
    // Pull down room selected
    const testChoice = $('input[name=roomCardSelect]:checked').val();
    if (testChoice) {
        if(!isAccusation){
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
    $('#modalWeaponCards').modal('show');
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
        socket.emit('suggestion', _player.id, _suggestedChar, _suggestedRoom, _suggestedWeapon);

    } else {
        console.log('Accusation made for char: ' + _accusedChar);
        console.log('Accusation made for room: ' + _accusedRoom);
        console.log('Accusation made for weapon: ' + _accusedWeapon);
        // @TODO: Kick off processing of accusation
        // use socket.emit to pass it off to server
        socket.emit('accusation', _player.id, _accusedChar, _accusedRoom, _accusedWeapon);

    }

    // Reset isAccusation
    isAccusation = false;

}

// for peeking at hand
function peekCards(){
    $('#modalPlayerCards').modal('show');
    console.log('Showing player hand');
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
    for (let i=0; i< players.length; i++) {
        context.fillStyle = playerColor(players[i].id);
        if (players[i].isHuman) {
            let player = players[i];
            tempX = player.oldPosition.x;
            tempY = player.oldPosition.y;
            startAnimation(player);
        }
    }
});

function initMap(players){
    if (players) {
        context.clearRect(0, 0, 600, 600);
        for (let i=0; i< players.length; i++) {
            context.fillStyle = playerColor(players[i].id);
            if (players[i].isHuman) {
                let player = players[i];
                tempX = spawnLocation2map(i).x;
                tempY = spawnLocation2map(i).y;
                startAnimation(player);
            }
        }
    }
}

function spawnLocation2map(spawnLocation){
    var position = {
        'x':0,
        'y':0
    };

    switch(spawnLocation){
        case 0:
            position.x = 410;
            position.y = 25;
            return position;
        case 1:
            position.x = 575;
            position.y = 190;
            return position;
        case 2:
            position.x = 410;
            position.y = 575;
            return position;
        case 3:
            position.x = 190;
            position.y = 575;
            return position;
        case 4:
            position.x = 30;
            position.y = 410;
            return position;
        case 5:
            position.x = 30;
            position.y = 190;
            return position;
    }
}

function startAnimation(player){
    animationTimer = setInterval(function () {
        // update position every 100 ms to create animation
        updatePosition(player);
    }, 5);
}

function updatePosition(player){
    if(tempX === player.positionMap.x && tempY === player.positionMap.y){
        clearInterval(animationTimer);
    }

    context.clearRect(0, 0, 600, 600);
    if(tempX > player.positionMap.x){
        tempX--;
    } else if (tempX < player.positionMap.x){
        tempX++;
    }

    if(tempY > player.positionMap.y){
        tempY--;
    } else if (tempY < player.positionMap.y){
        tempY++;
    }
    context.fillStyle = playerColor(player.id);
    context.beginPath();
    context.arc(tempX, tempY, 10, 0, 2 * Math.PI);
    context.fill();
}

function playerColor(id){
    switch(id){
        case 0:
            return 'red';
        case 1:
            return 'darkgoldenrod';
        case 2:
            return 'black';
        case 3:
            return 'green';
        case 4:
            return 'blue';
        case 5:
            return 'purple';
    }
}

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

// Receives players starting position
socket.on('initPosition', function(position, locationMap) {
    _playerPosition = position;
    console.log('Initial position: ' + position);
    _locationMap = locationMap;

    // Print to console to make sure locationMap retrieved
    for(let mapIdx=1; mapIdx<28; mapIdx++){
        console.log('If in location: ' + mapIdx);
        console.log('User can move to: ');
        for(let chain=0; chain < _locationMap[mapIdx].length; chain++){
            let testLocation = _locationMap[mapIdx][chain];
            console.log('Location: ' + testLocation);
        }
    }
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
        // disable all cards by default
        const testCard = $('input[name=cardSelect][value=' + _playerCards[j].name + ']');

        testCard.prop('disabled', false);
    }

    // Show cards
    $('#modalPlayerCards').modal('show');

    initMap(humanArr)
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
        let j = 0;
        for (let player in game.players) {
            if (game.players.hasOwnProperty(player)) {
                if (game.players[player].character in playerLabels) {
                    playerLabels[game.players[player].character].innerHTML = player;
                    playerLabels[game.players[player].character].fontColor = playerColor(j);
                }
            }
            j++;
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

    initMap();
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
            playerWrappers[i].style.border = '2px solid ' + playerColor(i);
        }
    }

    // Enable/disable buttons based on current turn
    $('.action').each(function () {
        $(this).prop('disabled', !(_currentTurn === _character));
    });
});

socket.on('request suggestion', function(playerWithCard, character, room, weapon){
    console.log('Player with card is: ' + playerWithCard.id);
    console.log('Current user is: ' + _player.id);

    if(playerWithCard.id == _player.id) {
        // MAKE A BOX POP UP WITH THE SUGGESTIONS HERE
        // (disable selection of any card that isnt character,room or weapon
        // Check what cards player has
        for(let j=0; j<_playerCards.length; j++){
            console.log(_playerCards[j].name);
            // disable all cards by default
            const testCard = $('input[name=cardSelect][value=' + _playerCards[j].name + ']');
            testCard.prop('disabled', true);

            if(_playerCards[j].name == character){
                testCard.prop('disabled', false);
            }

            if(_playerCards[j].name == room){
                testCard.prop('disabled', false);
            }

            if(_playerCards[j].name == weapon){
                testCard.prop('disabled', false);
            }

        }

        // Show cards
        $('#modalPlayerCards').modal('show');

        isSuggestion = true;
        //figure out the card to be suggested
        //suggestedCard =

        // then send the suggested card back to the server
        //socket.emit('suggestionToServer', suggestedCard);
    }
});

socket.on('show suggestion', function(username, card){
    console.log('Suggester: ' + username);
    console.log('This suggester: ' + _player.id);

    if(username == _player.id) {
        console.log('revealing card: ' + card);
        // Reveal card to user
        for(let i=0; i<21; i++){
            const testCard = $('input[name=cardSelect][value=' + i + ']');
            testCard.prop('disabled', true);

            // show
            if(i == card){
                testCard.prop('disabled', false);
            }

        }

        $('#modalPlayerCards').modal({backdrop: 'static', keyboard: false});
        //chatMessages.innerHTML += '<i>' + card + ' suggested' + '</i><br/>';
        //scrollToBottom();
    }
});

socket.on('end suggestion', function(suggester){
    if (suggester === _username) {
        chatMessages.innerHTML += '<i>' + 'Nobody had your suggestions' + '</i><br/>';
        scrollToBottom();
    }
});

socket.on('timer', function (timeElapsed) {
    timer.innerHTML = timeElapsed;
});