// Card class
// Set type and card name at construction

// Card type
// SUSPECT: 1
// ROOM: 2
// WEAPON: 3

class Card {
  constructor(intType, cardName){
    this.type = intType;
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
