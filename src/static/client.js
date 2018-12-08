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
    // If making 27 different ones, use switch statement
    // Sorry for the massive switch statement
    switch(_playerPosition){
        case 1: // Study
            $('#modalMoveFromStudy').modal({backdrop: 'static', keyboard: false});
            break;
        case 2:
            $('#modalMoveFromStudyHallHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 3:
            $('#modalMoveFromHall').modal({backdrop: 'static', keyboard: false});
            break;
        case 4:
            $('#modalMoveFromHallLoungeHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 5:
            $('#modalMoveFromLounge').modal({backdrop: 'static', keyboard: false});
            break;
        case 6:
            $('#modalMoveFromStudyLibraryHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 7:
            $('#modalMoveFromHallBilliardHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 8:
            $('#modalMoveFromLoungeDiningHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 9:
            $('#modalMoveFromLibrary').modal({backdrop: 'static', keyboard: false});
            break;
        case 10:
            $('#modalMoveFromLibraryBilliardHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 11:
            $('#modalMoveFromBilliard').modal({backdrop: 'static', keyboard: false});
            break;
        case 12:
            $('#modalMoveFromBilliardDiningHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 13:
            $('#modalMoveFromDining').modal({backdrop: 'static', keyboard: false});
            break;
        case 14:
            $('#modalMoveFromLibraryConservatoryHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 15:
            $('#modalMoveFromBilliardBallroomHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 16:
            $('#modalMoveFromDiningKitchenHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 17:
            $('#modalMoveFromConservatory').modal({backdrop: 'static', keyboard: false});
            break;
        case 18:
            $('#modalMoveFromConservatoryBallroomHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 19:
            $('#modalMoveFromBallroom').modal({backdrop: 'static', keyboard: false});
            break;
        case 20:
            $('#modalMoveFromBallroomKitchenHW').modal({backdrop: 'static', keyboard: false});
            break;
        case 21:
            $('#modalMoveFromKitchen').modal({backdrop: 'static', keyboard: false});
            break;
        case 22:
            $('#modalMoveFromScarletSpawn').modal({backdrop: 'static', keyboard: false});
            break;
        case 23:
            $('#modalMoveFromMustardSpawn').modal({backdrop: 'static', keyboard: false});
            break;
        case 24:
            $('#modalMoveFromWhiteSpawn').modal({backdrop: 'static', keyboard: false});
            break;
        case 25:
            $('#modalMoveFromGreenSpawn').modal({backdrop: 'static', keyboard: false});
            break;
        case 26:
            $('#modalMoveFromPeacockSpawn').modal({backdrop: 'static', keyboard: false});
            break;
        case 27:
            $('#modalMoveFromPlumSpawn').modal({backdrop: 'static', keyboard: false});
            break;
    }
}

// Function for ending movePlayer
function endMove(){
    // Retrieve selection
    const moveChoice = $('input[name=moveRoomCheckbox]:checked').val();
    if(moveChoice){
        console.log('Player moving to: ' + parseInt(moveChoice));

        $('#modalSelectMove').modal('hide');

        // Sorry for the long switch statement again
        switch(_playerPosition){
            case 1: // Study
                $('#modalMoveFromStudy').modal('hide');
                break;
            case 2:
                $('#modalMoveFromStudyHallHW').modal('hide');
                break;
            case 3:
                $('#modalMoveFromHall').modal('hide');
                break;
            case 4:
                $('#modalMoveFromHallLoungeHW').modal('hide');
                break;
            case 5:
                $('#modalMoveFromLounge').modal('hide');
                break;
            case 6:
                $('#modalMoveFromStudyLibraryHW').modal('hide');
                break;
            case 7:
                $('#modalMoveFromHallBilliardHW').modal('hide');
                break;
            case 8:
                $('#modalMoveFromLoungeDiningHW').modal('hide');
                break;
            case 9:
                $('#modalMoveFromLibrary').modal('hide');
                break;
            case 10:
                $('#modalMoveFromLibraryBilliardHW').modal('hide');
                break;
            case 11:
                $('#modalMoveFromBilliard').modal('hide');
                break;
            case 12:
                $('#modalMoveFromBilliardDiningHW').modal('hide');
                break;
            case 13:
                $('#modalMoveFromDining').modal('hide');
                break;
            case 14:
                $('#modalMoveFromLibraryConservatoryHW').modal('hide');
                break;
            case 15:
                $('#modalMoveFromBilliardBallroomHW').modal('hide');
                break;
            case 16:
                $('#modalMoveFromDiningKitchenHW').modal('hide');
                break;
            case 17:
                $('#modalMoveFromConservatory').modal('hide');
                break;
            case 18:
                $('#modalMoveFromConservatoryBallroomHW').modal('hide');
                break;
            case 19:
                $('#modalMoveFromBallroom').modal('hide');
                break;
            case 20:
                $('#modalMoveFromBallroomKitchenHW').modal('hide');
                break;
            case 21:
                $('#modalMoveFromKitchen').modal('hide');
                break;
            case 22:
                $('#modalMoveFromScarletSpawn').modal('hide');
                break;
            case 23:
                $('#modalMoveFromMustardSpawn').modal('hide');
                break;
            case 24:
                $('#modalMoveFromWhiteSpawn').modal('hide');
                break;
            case 25:
                $('#modalMoveFromGreenSpawn').modal('hide');
                break;
            case 26:
                $('#modalMoveFromPeacockSpawn').modal('hide');
                break;
            case 27:
                $('#modalMoveFromPlumSpawn').modal('hide');
                break;
        }

        // Set new playerPosition
        _playerPosition = parseInt(moveChoice)
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
    $('#modalRoomCards').modal({backdrop: 'static', keyboard: false});
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
    $('#modalPlayerCards').modal({backdrop: 'static', keyboard: false});
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
        console.log(_playerCards[j].name);
        // disable all cards by default
        const testCard = $('input[name=cardSelect][value=' + _playerCards[j].name + ']');

        switch(_playerCards[j].name) {
            case 0:
                testCard.prop('disabled', false);
                break;
            case 1:
                testCard.prop('disabled', false);
                break;
            case 2:
                testCard.prop('disabled', false);
                break;
            case 3:
                testCard.prop('disabled', false);
                break;
            case 4:
                testCard.prop('disabled', false);
                break;
            case 5:
                testCard.prop('disabled', false);
                break;
            case 6:
                testCard.prop('disabled', false);
                break;
            case 7:
                testCard.prop('disabled', false);
                break;
            case 8:
                testCard.prop('disabled', false);
                break;
            case 9:
                testCard.prop('disabled', false);
                break;
            case 10:
                testCard.prop('disabled', false);
                break;
            case 11:
                testCard.prop('disabled', false);
                break;
            case 12:
                testCard.prop('disabled', false);
                break;
            case 13:
                testCard.prop('disabled', false);
                break;
            case 14:
                testCard.prop('disabled', false);
                break;
            case 15:
                testCard.prop('disabled', false);
                break;
            case 16:
                testCard.prop('disabled', false);
                break;
            case 17:
                testCard.prop('disabled', false);
                break;
            case 18:
                testCard.prop('disabled', false);
                break;
            case 19:
                testCard.prop('disabled', false);
                break;
            case 20:
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
        $('#modalPlayerCards').modal({backdrop: 'static', keyboard: false});

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
