import { Hitbox } from "./hitboxes";

const cards_sprite_sheet = new SpriteSheet('cards.png', 73, 98, 52, 13);
const pot_location = []
export class Cardshark_State{
    constructor() {
        this.order = [];
        this.players = {};
        this.turn = -1;
        this.pot = [];
        this.self = -1;
        this.message = "";
    }

    play_card(card){
        const s = new Sprite(cards_sprite_sheet);
        s.x = 
        const h = new Hitbox(s.x, s.y, s.visual_width(), s.visual_height(), (e) => {console.log(e)}, "testing");


    }


    handle(response){
       if (response.hasOwnProperty("plays") && response.hasOwnProperty("actor")){
            this.play_card(response.plays);
            this.players[response.actor].stack_size -= 1;
       }
       if (response.hasOwnProperty("name") && response.hasOwnProperty("rename")){
            this.players[response.rename].name = response.name;
       }
       if (response.hasOwnProperty("order")){
            this.order = response.order;
            this.players = {};
            this.order.forEach((e, i) => {
                this.players[e] = new Player(e, i);
            });
       }
       if (response.hasOwnProperty("turn")){
            this.turn = response.turn;
       }
       if (response.hasOwnProperty("wins_pot")){
            this.message = response.wins_pot;
            this.pot = [];
       }
       if (response.hasOwnProperty("youare")){
            this.self = response.youare;
       }
       if (response.hasOwnProperty("stacks")){
            Object.entries(response.stacks).forEach(([key, value]) => {
                this.players[key].stack_size = value;
            })
       }
       if (response.hasOwnProperty("reset")){
            this.order = response.reset;
            this.players = {};
            this.order.forEach((e, i) => {
                this.players[e] = new Player(e, i, 0);
            });
            this.pot = [];
            this.pot_size = 0;
       }
    }

}

export class Cardshark_Player{
    constructor(id, turn_number){
        this.id = id;
        this.turn_number = -1;
        this.stack_size = 0;
        this.name = "Player";
    }
}