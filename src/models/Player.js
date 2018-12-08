const Characters = require('./characters');
const Card = require('./Card');

class Player {

    constructor(characterName) {
        // Private fields, default constructor (I think?)
        this.id = Characters[characterName];
        this.position = 0;
        this.cards = [];
        this.hasAccused = false;
        this.characterName = characterName;
        this.isHuman = false;
        this.positionMap = {
            'x': 0,
            'y': 0
        };
        this.oldPosition = {
            'x': 0,
            'y': 0
        };
    }

    // Parameterized constructor
    /*constructor(id, position, deck, characterName, isHuman) {
        this.id = id;
        this.position = position;
        this.deck = deck;
        this.hasAccused = false;
        this.characterName = characterName;
        this.isHuman = isHuman;
    } */

    getId() {
        return this.id;
    }

    setId(playerId) {
        this.id = playerId;
    }

    getPosition() {
        return this.position;
    }

    setPosition(newPosition) {
        this.position = newPosition;
    }

    getPositionMap() {
        return this.positionMap;
    }

    setPositionMap(newPositionX, newPositionY) {
        this.positionMap = {
            'x': newPositionX,
            'y': newPositionY
        };
    }

    getOldPosition() {
        return this.oldPosition;
    }

    setOldPosition(oldPositionX, oldPositionY) {
        this.oldPosition = {
            'x': oldPositionX,
            'y': oldPositionY
        };
    }

    getHasAccused() {
        return this.hasAccused;
    }

    setHasAccused(status) {
        this.hasAccused = status;
    }

    setCharacterName(name) {
        this.characterName = name;
    }

    getCharacterName() {
        return this.characterName;
    }

    getCards() {
        return this.cards;
    }

    addCard(newCard) {
        this.cards.push(newCard);
    }

    getIsHuman() {
        return this.isHuman;
    }

    setIsHuman(ishuman) {
        this.isHuman = ishuman;
    }

    checkSuggestion(character, room, weapon) {
        let currentCards = [];

        // If the character card exists within Player's deck
        if (hasCard(this.cards, character)) {
            currentCards.push(new Card(character));
        }

        // If the room card exists within Player's deck
        if (hasCard(this.cards, room)) {
            currentCards.push(new Card(room));
        }

        // If the weapon card exists within Player's deck
        if (hasCard(this.cards, weapon)) {
            currentCards.push(new Card(weapon));
        }

        return currentCards.length > 0;

    }

    playerDecides(directions) {
        if (directions.includes("N")) {
            // TODO GUI for north
        }
        if (directions.includes("S")) {
            // TODO GUI for south
        }
        if (directions.includes("E")) {
            // TODO GUI for east
        }
        if (directions.includes("W")) {
            // TODO GUI for west
        }
        if (directions.includes("T")) {
            // TODO GUI for tunnel
        }
        // TODO grab the users choice and assign
        let userSelection = null;
        return userSelection;


    }

    // Placeholder for showCard
    showCard() {
        // Prompt user to declare a card to show.
        // would this be on the client side?  Or we could use the deck
        // returned from checkSuggestion to prompt the user (client side)
    }

}

function hasCard(cardArr, card) {
    for (i = 0; i < cardArr.length; i++) {
        if (cardArr[i].name === card) {
            return true;
        }
    }
    return false;
}

module.exports = Player;