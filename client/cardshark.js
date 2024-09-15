import { Sprite }  from './src/sprites.js';
import { SpriteSheet } from './src/sprites.js';
import { Hitbox } from './src/hitboxes.js';
import { is_iterable } from './src/utils.js';
import { do_recursive } from './src/utils.js';
import { do_recursive_till_true } from './src/utils.js';

// game state stuff
class Cardshark_State{
    constructor() {
        this.order = [];
        this.players = {};
        this.turn = -1;
        this.pot = [];
        this.pot_hitboxes = [];
        this.self = -1;
        this.message = ""; 
        this.buttons = [];
    }

    play_card(card){
        const randomness = 40; //distance in pixels that the cards can deviate
        const randomness_degrees = 40;
        const s = new Sprite(cards_sprite_sheet);
        s.scale_x = 1/10;
        s.scale_y = 1/10;
        s.index = card;
        s.x = pot_center[0] - s.visual_width() / 2;
        s.x += Math.random() * randomness*2 - randomness; 
        s.y = pot_center[1] - s.visual_height() / 2;
        s.y += Math.random() * randomness*2 - randomness; 
        s.rotation += Math.random() * randomness_degrees*2 - randomness_degrees; 
        const h = new Hitbox(s.x, s.y, s.visual_width(), s.visual_height(), (e) => {send_cmd("slap")});
        h.linked_to_img = s;
        this.pot.push(s);
        this.pot_hitboxes.push(h);
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
                this.players[e] = new Cardshark_Player(e, i);
            });
       }
       if (response.hasOwnProperty("turn")){
            this.turn = response.turn;
       }
       if (response.hasOwnProperty("wins_pot")){
            this.message = response.wins_pot;
            this.pot = [];
            this.pot_hitboxes = [];
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
            this.pot_hitboxes = [];
            this.pot_size = 0;
       }
    }

}

 class Cardshark_Player{
    constructor(id, turn_number){
        this.id = id;
        this.turn_number = turn_number;
        this.stack_size = 0;
        this.name = "Player";
    }
}
function test(msg){
    console.log(msg);
}

// set up for client
const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d');
const cards_sprite_sheet = new SpriteSheet('./sprites/family.jpg', 1500, 2047, 16, 4);
const pot_center = [canvas.width / 2, canvas.height / 2];
const game = new Cardshark_State();

function test_button(){
    show_hitboxes = !show_hitboxes;
    // game.play_card(Math.floor(Math.random() * 16));
}

// websocket stuff
const socket = new WebSocket('wss://danielmarkjones.com:8081');

function send_info() {
    const textbox_contents = document.getElementById('textbox').value;
    socket.send('{"name":"'+textbox_contents+'"}');
}

function send_this(msg) {
    socket.send(msg);
}

function send_cmd(msg) {
    socket.send('{"cmd":"'+msg+'"}')
}

socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened:', event);
});

document.getElementById('test_button').addEventListener('click', test_button);
document.getElementById('send_name').addEventListener('click', send_info);
document.getElementById('start_game').addEventListener('click', () => { send_cmd("start")});
document.getElementById('play_card').addEventListener('click', () => { send_cmd("play")});
document.getElementById('slap_pile').addEventListener('click', () => { send_cmd("slap")});
document.getElementById('reset_game').addEventListener('click', () => { send_cmd("reset")});

socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);
    document.getElementById('result').test = event.data;
    let response = {};
    try {
        response = JSON.parse(event.data);
        game.handle(response);
    }catch(error){
        if (error instanceof SyntaxError){
            console.log("incorrect parse" + event.data)
        }
        console.error("Unexpected error", error)
    }
});

// Event listener for when the connection is closed
socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event);
});

// Event listener for errors
socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
});

// set up clicking
canvas.addEventListener('click', function(event) {
    // Get the click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const res = do_recursive_till_true([game.buttons,[...game.pot_hitboxes].reverse()], (e) => {
        if (e.linked_to_img != null) e.update_to_link();
        if(e.check_is_within(clickX, clickY)) {
                e.f();
                return true;
        }
        return false;
    });
    for (let i = game.pot_hitboxes.length - 1; i >= 0; i--) {
    }
});

// set up mouse movement
var mousex = 0;
var mousey = 0;
canvas.addEventListener('mousemove', function(event){
    const rect = canvas.getBoundingClientRect();
    mousex = event.clientX - rect.left;
    mousey = event.clientY - rect.top; 
});

// set up animation
var last_frame_time = performance.now();
var frame_count = 0;
var fps = 0;

function calculate_fps(current_time){
    const delta_time = current_time - last_frame_time;
    frame_count++;
    if (delta_time >= 1000){
        fps = frame_count;
        frame_count = 0;
        last_frame_time = current_time;
    }
    document.getElementById('debug_place').textContent += ` FPS: ${fps}`;
}

function draw_recursive(obj){
    if (is_iterable(obj)){
        for (const elem of obj){
            draw_recursive(elem);
        }
    }else{
        obj.draw(ctx);
    }
}

const deck_sprite = new Sprite(cards_sprite_sheet);
deck_sprite.index = 0;
deck_sprite.scale_x = .1;
deck_sprite.scale_y = .1;
deck_sprite.x = 800;
deck_sprite.y = 530;
const play_card_button = new Hitbox(deck_sprite.x, deck_sprite.y, deck_sprite.visual_width(), deck_sprite.visual_height(), () => {send_cmd("play")});
play_card_button.linked_to_img = deck_sprite;
game.buttons.push(play_card_button);

// handle rendering
var show_hitboxes = false;
function draw_frame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_recursive(deck_sprite);
    draw_recursive([game.pot]);
    if (show_hitboxes) draw_recursive([game.buttons, game.pot_hitboxes]);
    document.getElementById('debug_place').textContent = `(mousex, mousey): (${mousex}, ${mousey})`;
    calculate_fps(performance.now());
    requestAnimationFrame(draw_frame);
}
requestAnimationFrame(draw_frame);
