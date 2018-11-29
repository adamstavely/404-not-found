class Player {

    constructor() {
        // Private fields, default constructor (I think?)
        this.id = 0;
        this.position = 0;
        this.cards = [];
        this.hasAccused = false;
        this.characterName = 'null';
        this.isHuman = false;
    }

    // Parameterized constructor
    /*constructor(id, position, cards, characterName, isHuman) {
        this.id = id;
        this.position = position;
        this.cards = cards;
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

    setCharacterName(name){
        this.characterName = name;
    }

    getCharacterName(){
        return this.characterName;
    }

    getCards() {
        return this.cards;
    }

    addCard(newCard) {
        this.cards.push(newCard);
    }

    getIsHuman(){
        return this.isHuman;
    }

    setIsHuman(ishuman){
        this.isHuman = ishuman;
    }

    checkSuggestion(character, room, weapon) {
        var currentCards = [];
        var tempCard;

        tempCard = this.cards.find(character);
        // If the character card exists within Player's cards
        if('undefined' !== typeof tempCard){
            currentCards.push(tempCard)
        }

        tempCard = this.cards.find(room);
        // If the room card exists within Player's cards
        if('undefined' !== typeof tempCard){
            currentCards.push(tempCard)
        }

        tempCard = this.cards.find(weapon);
        // If the weapon card exists within Player's cards
        if('undefined' !== typeof tempCard){
            currentCards.push(tempCard)
        }

        return currentCards;
    }

    // Placeholder for showCard
    showCard() {
        // Prompt user to declare a card to show.
        // would this be on the client side?  Or we could use the cards
        // returned from checkSuggestion to prompt the user (client side)
    }

}

module.exports = Player;