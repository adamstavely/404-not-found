const Characters = require('./characters');

class Player {

    constructor(characterName) {
        // Private fields, default constructor (I think?)
        this.id = Characters[characterName];
        this.position = 0;
        this.cards = [];
        this.hasAccused = false;
        this.characterName = characterName;
        this.isHuman = false;
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
        let tempCard;

        tempCard = this.cards.find(character);
        // If the character card exists within Player's deck
        if ('undefined' !== typeof tempCard) {
            currentCards.push(tempCard)
        }

        tempCard = this.cards.find(room);
        // If the room card exists within Player's deck
        if ('undefined' !== typeof tempCard) {
            currentCards.push(tempCard)
        }

        tempCard = this.cards.find(weapon);
        // If the weapon card exists within Player's deck
        if ('undefined' !== typeof tempCard) {
            currentCards.push(tempCard)
        }

        return currentCards;
    }

    playerDecides(directions) {
        if (directions.includes("N")){
            // TODO GUI for north
        }
        if (directions.includes("S")){
            // TODO GUI for south
        }
        if (directions.includes("E")){
            // TODO GUI for east
        }
        if (directions.includes("W")){
            // TODO GUI for west
        }
        if (directions.includes("T")){
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

module.exports = Player;