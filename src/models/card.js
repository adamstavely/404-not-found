// Card class
// Set type and card name at construction

// Card type
// SUSPECT: 1
// ROOM: 2
// WEAPON: 3
const CARD_TYPE = {
  SUSPECT: 0,
  ROOM: 1,
  WEAPON: 2,
  INVALID: 3
};

// Card names: suspect, room or weapon
const CARD_NAME = {
  MISS_SCARLETT_CARD: 0,
  COL_MUSTARD_CARD: 1,
  MRS_WHITE_CARD: 2,
  MR_GREEN_CARD: 3,
  MRS_PEACOCK_CARD: 4,
  PROF_PLUM_CARD: 5,
  KITCHEN_CARD: 6,
  BALLROOM_CARD: 7,
  CONSERVATORY_CARD: 8,
  DINING_ROOM_CARD: 9,
  BILLIARD_ROOM_CARD: 10,
  LIBRARY_CARD: 11,
  LOUNGE_CARD: 12,
  HALL_CARD: 13,
  STUDY_CARD: 14,
  CANDLESTICK_CARD: 15,
  DAGGER_CARD: 16,
  LEAD_PIPE_CARD: 17,
  REVOLVER_CARD: 18,
  ROPE_CARD: 19,
  SPANNER_CARD: 20
};

class Card {
  constructor(cardName){
    if(cardName >= CARD_NAME.MISS_SCARLETT_CARD && cardName <= CARD_NAME.PROF_PLUM_CARD){
      this.type = CARD_TYPE.SUSPECT;
    } else if(cardName > CARD_NAME.PROF_PLUM_CARD && cardName <= CARD_NAME.STUDY_CARD){
      this.type = CARD_TYPE.ROOM;
    } else if(cardName > CARD_NAME.STUDY_CARD && cardName <= CARD_NAME.SPANNER_CARD){
      this.type = CARD_TYPE.WEAPON;
    } else {
      // invalid
      this.type = CARD_TYPE.INVALID;
    }

    this.name = cardName;
  }

  // Accessor for card type
  getType(){
    return this.type;
  }

  // Accessor for card name
  getName(){
    return this.name;
  }
}

module.exports = Card;
