class Player {
    // Private fields, default constructor (I think?)
    #id = null;
    #position = 0;
    #cards = [];
    #hasAccused = false;
    #characterName = null;

    // Parameterized constructor
    constructor(id, position, cards, characterName) {
        this.#id = id;
        this.#position = position;
        this.#cards = cards;
        this.#hasAccused = false;
        this.#characterName = characterName;
    }

    get id() {
        return this.#id;
    }

    set id(playerId) {
        this.#id = playerId;
    }

    get position() {
        return this.#position;
    }

    set position(newPosition) {
        this.#position = newPosition;
    }

    set hasAccused(status) {
        this.#hasAccused = status;
    }

    get cards() {
        return this.#cards;
    }

    addCard(newCard) {
        this.#cards.push(newCard);
    }

    checkSuggestion(character, room, weapon) {
        var currentCards = [];
        var tempCard;

        tempCard = this.#cards.find(character);
        // If the character card exists within Player's cards
        if('undefined' !== typeof tempCard){
            currentCards.push(tempCard)
        }

        tempCard = this.#cards.find(room);
        // If the room card exists within Player's cards
        if('undefined' !== typeof tempCard){
            currentCards.push(tempCard)
        }

        tempCard = this.#cards.find(weapon);
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