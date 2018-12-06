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

    findValidMoves(player) {
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
            1: {"E": Locations.HALLWAY_STUDY_HALL, "S": Locations.HALLWAY_STUDY_LIBRARY, "T": Locations.KITCHEN},
            2: {"W": Locations.STUDY, "E": Locations.HALL},
            3: {"W": Locations.HALLWAY_STUDY_HALL, "E": Locations.HALLWAY_HALL_LOUNGE, "S": Locations.HALLWAY_HALL_BILLIARD},
            4: {"W": Locations.HALL, "E": Locations.LOUNGE},
            5: {"W": Locations.HALLWAY_HALL_LOUNGE, "S": Locations.HALLWAY_LOUNGE_DINING, "T": Locations.CONSERVATORY},
            6: {"N": Locations.STUDY, "S": Locations.LIBRARY},
            7: {"N": Locations.HALL, "S": Locations.BILLIARD_ROOM},
            8: {"N": Locations.LOUNGE, "S": Locations.DINING_ROOM},
            9: {"N": Locations.HALLWAY_STUDY_LIBRARY, "E": Locations.HALLWAY_LIBRARY_BILLIARD, "S": Locations.HALLWAY_LIBRARY_CONSERVATORY},
            10: {"W": Locations.LIBRARY, "E": Locations.BILLIARD_ROOM},
            11: {"N": Locations.HALLWAY_HALL_BILLIARD, "W": Locations.HALLWAY_LIBRARY_BILLIARD, "E": Locations.HALLWAY_BILLIARD_DINING, "S": Locations.HALLWAY_BILLIARD_BALLROOM},
            12: {"W": Locations.BILLIARD_ROOM, "E": Locations.DINING_ROOM},
            13: {"N": Locations.HALLWAY_LOUNGE_DINING, "W": Locations.HALLWAY_BILLIARD_DINING, "S": Locations.HALLWAY_DINING_KITCHEN},
            14: {"N": Locations.LIBRARY, "S": Locations.CONSERVATORY},
            15: {"N": Locations.BILLIARD_ROOM, "S": Locations.BALLROOM},
            16: {"N": Locations.DINING_ROOM, "S": Locations.KITCHEN},
            17: {"T": Locations.LOUNGE, "N": Locations.HALLWAY_LIBRARY_CONSERVATORY, "E": Locations.HALLWAY_CONSERVATORY_BALLROOM},
            18: {"W": Locations.CONSERVATORY, "E": Locations.BALLROOM},
            19: {"N": Locations.HALLWAY_BILLIARD_BALLROOM, "W": Locations.HALLWAY_CONSERVATORY_BALLROOM, "E": Locations.HALLWAY_BALLROOM_KITCHEN},
            20: {"W": Locations.BALLROOM, "E": Locations.KITCHEN},
            21: {"T": Locations.STUDY, "N": Locations.HALLWAY_DINING_KITCHEN, "W": Locations.HALLWAY_BALLROOM_KITCHEN},
            22: {"S": Locations.HALLWAY_HALL_LOUNGE},
            23: {"E": Locations.HALLWAY_LOUNGE_DINING},
            24: {"W": Locations.HALLWAY_BALLROOM_KITCHEN},
            25: {"E": Locations.HALLWAY_CONSERVATORY_BALLROOM},
            26: {"N": Locations.HALLWAY_LIBRARY_CONSERVATORY},
            27: {"N": Locations.HALLWAY_STUDY_LIBRARY}
        };

        let sourceInt = this.players[player].getPosition();
        // TODO give player gui choice of directions via playerDecides function
        let destDir = Player.playerDecides(Object.keys(locationMap[sourceInt]));
        let destInt = locationMap[sourceInt][destDir];
        if ([2,4,6,7,8,10,12,14,15,16,18,20].includes(destInt)) {
            for (let p in this.players) {
                if (p.position == destInt) {
                    return null;
                }
            }
        }
        return destInt;
    }

    movePlayer(player, destInt, isMoved) {
        // isMoved is a boolean that tells if:
        // True: being moved as part of a suggestion
        // False: player trying to move, so move must be valid
        // destInt can be null if isMoved is False
        if (isMoved) {
            this.players[player].setPosition(destInt);
            return true;
        } else {
            destInt = this.findValidMoves(player);
            this.players[player].setPosition(destInt);

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

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[(i + this.currentTurn + 1) % this.players.length].getIsHuman()) {
                if (this.players[(i + this.currentTurn + 1) % this.players.length].checkSuggestion(character, room, weapon)) {
                    return true;
                }
            }
        }

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
