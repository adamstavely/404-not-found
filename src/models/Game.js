const Characters = require('./characters');
const Player = require('./Player');
const Card = require('./Card');
const Locations = require('./locations');

// Player position enum
const INITIAL_POSITIONS = [
    Locations.SPAWN_SCARLET,
    Locations.SPAWN_MUSTARD,
    Locations.SPAWN_WHITE,
    Locations.SPAWN_GREEN,
    Locations.SPAWN_PEACOCK,
    Locations.SPAWN_PLUM
];

/*
1- 2,6,21       Study
2- 1,3          - Hallway
3- 2,4,7        Hall
4- 3,5          - Hallway
5- 4,8,17       Lounge
6- 1,9          - Hallway
7- 3,11         - Hallway
8- 5,13         - Hallway
9- 6,10,14      Library
10- 9,11        - Hallway
11- 7,10,12,15  Billiard Room
12- 11,13       - Hallway
13- 8,12,16     Dining Room
14- 9,17        - Hallway
15- 11,19       - Hallway
16- 13,21       - Hallway
17- 5,14,18     Conservatory
18- 17,19       - Hallway
19- 15,18,20    Ballroom
20- 19,21       - Hallway
21- 1,16,20     Kitchen
22- 4           Spawn Scarlet
23- 8           Spawn Mustard
24- 20          Spawn White
25- 18          Spawn Green
26- 14          Spawn Peacock
27- 6           Spawn Plum
 */
let locationMap = {
    1: [Locations.HALLWAY_STUDY_HALL, Locations.HALLWAY_STUDY_LIBRARY, Locations.KITCHEN],
    2: [Locations.STUDY, Locations.HALL],
    3: [Locations.HALLWAY_STUDY_HALL, Locations.HALLWAY_HALL_LOUNGE, Locations.HALLWAY_HALL_BILLIARD],
    4: [Locations.HALL, Locations.LOUNGE],
    5: [Locations.HALLWAY_HALL_LOUNGE, Locations.HALLWAY_LOUNGE_DINING, Locations.CONSERVATORY],
    6: [Locations.STUDY, Locations.LIBRARY],
    7: [Locations.HALL, Locations.BILLIARD_ROOM],
    8: [Locations.LOUNGE, Locations.DINING_ROOM],
    9: [Locations.HALLWAY_STUDY_LIBRARY, Locations.HALLWAY_LIBRARY_BILLIARD, Locations.HALLWAY_LIBRARY_CONSERVATORY],
    10: [Locations.LIBRARY, Locations.BILLIARD_ROOM],
    11: [Locations.HALLWAY_HALL_BILLIARD, Locations.HALLWAY_LIBRARY_BILLIARD, Locations.HALLWAY_BILLIARD_DINING, Locations.HALLWAY_BILLIARD_BALLROOM],
    12: [Locations.BILLIARD_ROOM, Locations.DINING_ROOM],
    13: [Locations.HALLWAY_LOUNGE_DINING, Locations.HALLWAY_BILLIARD_DINING, Locations.HALLWAY_DINING_KITCHEN],
    14: [Locations.LIBRARY, Locations.CONSERVATORY],
    15: [Locations.BILLIARD_ROOM, Locations.BALLROOM],
    16: [Locations.DINING_ROOM, Locations.KITCHEN],
    17: [Locations.LOUNGE, Locations.HALLWAY_LIBRARY_CONSERVATORY, Locations.HALLWAY_CONSERVATORY_BALLROOM],
    18: [Locations.CONSERVATORY, Locations.BALLROOM],
    19: [Locations.HALLWAY_BILLIARD_BALLROOM, Locations.HALLWAY_CONSERVATORY_BALLROOM, Locations.HALLWAY_BALLROOM_KITCHEN],
    20: [Locations.BALLROOM, Locations.KITCHEN],
    21: [Locations.STUDY, Locations.HALLWAY_DINING_KITCHEN, Locations.HALLWAY_BALLROOM_KITCHEN],
    22: [Locations.HALLWAY_HALL_LOUNGE],
    23: [Locations.HALLWAY_LOUNGE_DINING],
    24: [Locations.HALLWAY_BALLROOM_KITCHEN],
    25: [Locations.HALLWAY_CONSERVATORY_BALLROOM],
    26: [Locations.HALLWAY_LIBRARY_CONSERVATORY],
    27: [Locations.HALLWAY_STUDY_LIBRARY]
};

class Game {
    constructor() {
        this.deck = [];
        this.deckSize = 21;
        this.solution = {
            "Suspect": null,
            "Room": null,
            "Weapon": null
        };
        this.numPlayers = 0;
        this.currentTurn = Characters.MISS_SCARLET;
        this.players = [
            new Player('MISS_SCARLET'),
            new Player('COL_MUSTARD'),
            new Player('MRS_WHITE'),
            new Player('MR_GREEN'),
            new Player('MRS_PEACOCK'),
            new Player('PROF_PLUM'),
        ];
        this.MAX_TIME = 150; // seconds TODO: change to 180
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    setNumPlayers(numPlayers) {
        this.numPlayers = numPlayers;
    }

    initDeck() {
        for (let i = 0; i < this.deckSize; i++) {
            this.deck[i] = new Card(i);
        }
    }

    dealCards() {
        // create array of players to return
        let humanArray = new Array(this.numPlayers);

        let shuffledArray = Game.shuffleArray(this.deck);
        for (let i = 0; i < this.deck.length; i++) {
            if (this.solution["Suspect"] == null && this.deck[i].type === Card.TYPE.SUSPECT) {
                this.solution["Suspect"] = this.deck[i];
            } else if (this.solution["Room"] == null && this.deck[i].type === Card.TYPE.ROOM) {
                this.solution["Room"] = this.deck[i];
            } else if (this.solution["Weapon"] == null && this.deck[i].type === Card.TYPE.WEAPON) {
                this.solution["Weapon"] = this.deck[i];
            }
        }

        // console.log('Solution: ' + JSON.stringify(this.solution, null, 2));

        this.deck.splice(this.deck.indexOf(this.solution["Suspect"]), 1);
        this.deck.splice(this.deck.indexOf(this.solution["Room"]), 1);
        this.deck.splice(this.deck.indexOf(this.solution["Weapon"]), 1);

        let allHands = [];
        for (let i = this.numPlayers; i > 0; i--) {
            allHands.push([]);
        }
        for (let i = 0; i < shuffledArray.length; i++) {
            allHands[i % this.numPlayers].push(shuffledArray[i]);
        }
        // assign to each player here
        let count = 0;
        for (let i = 0; i < this.players.length; i++) {
            let p = this.players[i];
            if (this.players[i].isHuman) {
                p.cards = allHands[count];
                humanArray[count] = p;
                count++;
            }
        }

        return humanArray;
    }

    // Initialize player positions based on players
    initPlayer(characterId) {
        if (characterId in Object.values(Characters)) {
            this.players[characterId].setPosition(INITIAL_POSITIONS[characterId]);
            this.players[characterId].setIsHuman(true);

            return INITIAL_POSITIONS[characterId];
        } else {
            return 0;
        }
    }

    isMoveValid(player, destInt) {
        // TODO: check for players in hallways
        let sourceInt = this.players[player].getPosition();
        return locationMap[sourceInt].includes(destInt);
    }

    // Accessor for location map
    getLocationMap(){
        return locationMap;
    }

    movePlayer(player, destInt, isMoved) {
        // isMoved is a boolean that tells if:
        // True: being moved as part of a suggestion
        // False: player trying to move, so move must be valid
        if (isMoved) {
            this.players[player].setPosition(destInt);
            return true;
        } else {
            if (this.isMoveValid(player, destInt)) {
                this.players[player].setPosition(destInt);
                return true;
            } else {
                // make another move
                return false;
            }
        }
    }

    handleSuggestion(suggester, character, room, weapon) {
        /*
        Weapon IDs:
        1: Candlestick
        2: LeadPipe
        3: Revolver
        4: Rope
        5: Wrench
        6: Knife
         */
        this.movePlayer(character, room, true);

        // chris
        for (let i = 0; i < this.players.length; i++) {
            // make sure the suggester isnt chosen
            if(suggester != this.players[i].id) {
                // find the first player that has the suggestion (should really start at the suggester)
                if (this.players[i].checkSuggestion(character, room, weapon)) {
                    return this.players[i];
                }
            }
        }

        // colin
        /*for (let i = 0; i < this.players.length; i++) {
            if (this.players[(i + this.currentTurn + 1) % this.players.length].getIsHuman()) {
                if (this.players[(i + this.currentTurn + 1) % this.players.length].checkSuggestion(character, room, weapon)) {
                    return true;
                }
            }
        }*/

        // No one had any of the suggested deck
        return null;
    }

    handleAccusation(accuserPlayer, suspect, roomInt, weaponID) {
        if (this.solution["Character"] === suspect) {
            if (this.solution["Room"] === roomInt) {
                if (this.solution["Weapon"] === weaponID) {
                    // TODO: Game Over
                }
            }
        }
        accuserPlayer.hasAccused = true;
    }

    updateTimer(timeElapsed, timeIsUp) {
        timeIsUp = false;
        if (timeElapsed >= this.MAX_TIME) {
            //console.log('Timer reset at ' + timeElapsed + ' seconds')
            this.resetTimer(timeElapsed);
            timeIsUp = true;
        }
        return timeIsUp;
    }

    resetTimer(curr_time) {
        console.log('Game timer reached limit (' + curr_time + ' seconds)');
    }

    getNextTurn() {
        console.log('Getting next turn...');
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[(i + this.currentTurn + 1) % this.players.length].getIsHuman() &&
                !this.players[(i + this.currentTurn + 1) % this.players.length].getHasAccused()) {
                this.currentTurn = this.players[(i + this.currentTurn + 1) % this.players.length].getId();
                return this.currentTurn;
            }
        }
    }

    getFirstTurn() {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].getIsHuman()) {
                this.currentTurn = this.players[i].getId();
                return this.currentTurn;
            }
        }
    }

    getTurn() {
        return this.currentTurn;
    }

}

module.exports = Game;
