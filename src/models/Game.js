const characters = require('./characters');
const Player = require('./Player');
const Card = require('./card');

// Create players
const missScarlet = new Player('MISS_SCARLET');
const colMustard = new Player('COL_MUSTARD');
const mrsWhite = new Player('MRS_WHITE');
const mrGreen = new Player('MR_GREEN');
const mrsPeacock = new Player('MRS_PEACOCK');
const profPlum = new Player('PROF_PLUM');

const deckSize = 21;

// Player position enum
const PLAYER_POS = {
    MISS_SCARLET_POS: 22,
    COL_MUSTARD_POS: 23,
    MRS_WHITE: 24,
    MR_GREEN: 25,
    MRS_PEACOCK: 26,
    PROF_PLUM: 27,
    INVALID: 0
};

class Game {
    constructor() {
        this.deck = [];
        this.solution = {
            "Suspect": null,
            "Room": null,
            "Weapon": null
        };
        //this.players;
        this.numPlayers = 0;
        this.currentPlayerTurn = 0;
        this.timeLimit = 180000;
        this.playerOrder = [
            missScarlet,
            colMustard,
            mrsWhite,
            mrGreen,
            mrsPeacock,
            profPlum];
        this.MAX_TIME = 180000;
    }

    setNumPlayers(numPlayers) {
        this.numPlayers = numPlayers;
    }

    initDeck() {
        for (let i = 0; i < deckSize; i++) {
            this.deck[i] = new Card(i);
        }
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
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
        for (let i = 0; i < this.playerOrder.length; i++) {
            let p = this.playerOrder[i];
            if (this.playerOrder[i].isHuman) {
                p.cards = allHands[count];
                humanArray[count] = p;
                count++;
            }
        }

        return humanArray;
    }

    // Initialize player positions based on players
    initPlayer(characterId) {
        switch (Number(characterId)) {
            case 0: // MISS_SCARLET
                missScarlet.setPosition(PLAYER_POS.MISS_SCARLET_POS);
                missScarlet.setId(characterId);
                missScarlet.setIsHuman(true);

                return PLAYER_POS.MISS_SCARLET_POS;
            case 1: // COL_MUSTARD
                colMustard.setPosition(PLAYER_POS.COL_MUSTARD_POS);
                colMustard.setId(characterId);
                colMustard.setIsHuman(true);

                return PLAYER_POS.COL_MUSTARD_POS;
            case 2: // MRS_WHITE
                mrsWhite.setPosition(PLAYER_POS.MRS_WHITE);
                mrsWhite.setId(characterId);
                mrsWhite.setIsHuman(true);

                return PLAYER_POS.MRS_WHITE;
            case 3: // MR_GREEN
                mrGreen.setPosition(PLAYER_POS.MR_GREEN);
                mrGreen.setId(characterId);
                mrGreen.setIsHuman(true);

                return PLAYER_POS.MR_GREEN;
            case 4: // MRS_PEACOCK
                mrsPeacock.setPosition(PLAYER_POS.MRS_PEACOCK);
                mrsPeacock.setId(characterId);
                mrsPeacock.setIsHuman(true);

                return PLAYER_POS.MRS_PEACOCK;
            case 5: // PROF_PLUM
                profPlum.setPosition(PLAYER_POS.PROF_PLUM);
                profPlum.setId(characterId);
                profPlum.setIsHuman(true);

                return PLAYER_POS.PROF_PLUM;
            default:
                return PLAYER_POS.INVALID;
        }
    }

    isMoveValid(player, destInt) {
        /*
        1- 2,6,21       Study
        2- 1,3
        3- 2,4,7        Hall
        4- 3,5
        5- 4,8,17       Lounge
        6- 1,9
        7- 3,11
        8- 5,13
        9- 6,10,14      Library
        10- 9,11
        11- 7,10,12,15  Billiard Room
        12- 11,13
        13- 8,12,16     Dining Room
        14- 9,17
        15- 11,19
        16- 13,21
        17- 5,14,18     Conservatory
        18- 17,19
        19- 15,18,20    Ball Room
        20- 19,21
        21- 1,16,20     Kitchen
        22- 4           Spawn Scarlet
        23- 6           Spawn Plum
        24- 8           Spawn Mustard
        25- 14          Spawn Peacock
        26- 18          Spawn Green
        27- 20          Spawn White
         */
        let dict = {
            1: [2, 6, 21],
            2: [1, 3],
            3: [2, 4, 7],
            4: [3, 5],
            5: [4, 8, 17],
            6: [1, 9],
            7: [3, 11],
            8: [5, 13],
            9: [6, 10, 14],
            10: [9, 11],
            11: [7, 10, 12, 15],
            12: [11, 13],
            13: [8, 12, 16],
            14: [9, 17],
            15: [11, 19],
            16: [13, 21],
            17: [5, 14, 18],
            18: [17, 19],
            19: [15, 18, 20],
            20: [19, 21],
            21: [1, 16, 20],
            22: [4],
            23: [6],
            24: [8],
            25: [14],
            26: [18],
            27: [20]
        };

        let sourceInt = player.position;
        return dict[sourceInt].includes(destInt);
    }

    movePlayer(player, destInt, isMoved) {
        // isMoved is a boolean that tells if:
        // True: being moved as part of a suggestion
        // False: player trying to move, so move must be valid
        if (isMoved) {
            player.position = destInt;
            return true;
        } else {
            if (this.isMoveValid(player, destInt)) {
                player.position = destInt;
                return true;
            } else {
                // make another move
                return false;
            }
        }
    }

    handleSuggestion(suggesterPlayer, suspect, weaponID) {
        /*
        Weapon IDs:
        1: Candlestick
        2: LeadPipe
        3: Revolver
        4: Rope
        5: Wrench
        6: Knife
         */
        this.movePlayer(suspect, suggesterPlayer.position(), true);
        let playInt = this.playerOrder.indexOf(suggesterPlayer.characterName) + 1;
        let checkingPlayer = this.playerOrder[playInt % this.numPlayers];
        let shownCard = null;
        while (checkingPlayer != suggesterPlayer) {
            shownCard = checkingPlayer.checkSuggestion(suspect, suggesterPlayer.position(), weaponID);
            if (shownCard != null) {
                return shownCard;
            }
        }
        // No one had any of the suggested deck
        return null;
    }

    handleAccusation(accuserPlayer, suspect, roomInt, weaponID) {
        if (this.solution["Character"] == suspect) {
            if (this.solution["Room"] == roomInt) {
                if (this.solution["Weapon"] == weaponID) {
                    //Game Over
                    GameOver();
                }
            }
        }
        accuserPlayer.hasAccused = true;
    }

    startTimer() {
        this.timeLimit = setTimeout(() => {
            this.nextTurn();
        }, this.MAX_TIME)
    }

    resetTimer() {
        if (typeof this.timeLimit == this.MAX_TIME) {
            clearTimeout(this.turnOver);
        }
    }

    nextTurn() {
        this.turn = this.current_turn++ % this.numPlayers - 1;
        this.startTimer();
    }

}

module.exports = Game;
