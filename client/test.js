const socket = new WebSocket('ws://danbotlab.local:8080');
function send_info() {
    const textbox_contents = document.getElementById('textbox').value;
    socket.send(textbox_contents);
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
const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d');


function resize_canvas(){
    const aspectRatio = 16 / 9;

    let width = window.innerWidth / 2;
    let height = window.innerHeight/ 2;

    if (width / height > aspectRatio) {
        // If the viewport is wider than the aspect ratio, match height
        width = height * aspectRatio;
    } else {
        // If the viewport is taller than the aspect ratio, match width
        height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.font = `${canvas.width / 20}px Arial`; // Example: text size scales with canvas width

    ctx.fillStyle = 'black'; // Set the text color
    ctx.textAlign = 'center'; // Set text alignment
    ctx.textBaseline = 'middle'; // Set the baseline alignment
}
resize_canvas();
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function draw_sprite(ctx, sprite, x, y, index){
        if (sprite.loaded && index < sprite.length){
            const sprite_x_coord = (index % sprite.num_in_row) * sprite.width;
            const sprite_y_coord = Math.trunc(index / sprite.num_in_row) * sprite.height;
            ctx.drawImage(sprite.img, sprite_x_coord, sprite_y_coord, sprite.width, sprite.height, x, y, sprite.width, sprite.height);
        }
        console.log("not loaded" + sprite.loaded + index + sprite.length);
}
class Sprite {
    constructor(src, width, height, length, num_in_row){
        self = this;
        this.src = src;
        this.img = new Image();
        this.width = width;
        this.height = height;
        this.length = length;
        this.num_in_row = num_in_row;
        this.loaded = false;
        this.img.onload = function(){self.loaded = true};
        this.img.src = this.src;
    }
}


const cards = new Sprite('cards.png', 73, 98, 52, 13);
console.log(cards.src);
const img = new Image();
img.src = 'cards.png'
window.addEventListener('resize', resize_canvas)
function draw_debug(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText("width: " + canvas.width + "height: " + canvas.height, canvas.width / 2, canvas.height / 2);
   // ctx.drawImage(img, 0, 0, 74, 98, 0, 0, 74, 98);
    state.pot.forEach(function(e, i){
        draw_sprite(ctx, cards,canvas.width/2 - cards.width/2 + i *20, canvas.height/2 - cards.height/2 + i *20, e); 
    });
}

function draw_players(order, turn, players, self_id){
    const player_canvas = document.getElementById("player_canvas");
    player_canvas.innerHTML = '';
    for (let i = 0; i< order.length; i++){
        const player = players[order[i]];
        const li = document.createElement('li'); 
        li.textContent = player.info();
        if (order[i] == self_id) li.textContent += " ME ";
        if (i == turn) li.textContent += "<== TURN";
        player_canvas.appendChild(li);
    }
}
function draw_pot(pot){
    pot_area = document.getElementById("play_space");
    if (pot.length > 0) pot_area.innerHTML = pot;
    else pot_area.innerHTML = "";
}

let state = {
    "order" : [],
    "turn": -1,
    "pot_size": 0,
    "players": {},
    "pot": [],
    "self": 0,
};
function draw_state() {
    draw_debug();
    draw_players(state.order, state.turn, state.players, state.self);
    draw_pot(state.pot);
    requestAnimationFrame(draw_state);
}

requestAnimationFrame(draw_state);

class Player {
    constructor(id, turnNumber, stackSize) {
        this.id = id;                   // Number
        this.turnNumber = turnNumber;   // Integer
        this.stackSize = stackSize;     // Integer
        this.name = "Player";               // String
    }

    // Optional: A method to display player details
    displayPlayerInfo() {
        console.log(`Player ${this.name} (ID: ${this.id})`);
        console.log(`Turn Number: ${this.turnNumber}`);
        console.log(`Stack Size: ${this.stackSize}`);
    }

    info() {
        return `${this.name} ${this.id} ${this.turnNumber} ${this.stackSize}`
    }
}

// Event listener for when a message is received from the server
socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);
    document.getElementById('result').textContent = event.data;
    let response = {};
    try {
       response = JSON.parse(event.data);
       if (response.hasOwnProperty("plays") && response.hasOwnProperty("actor")){
            state.pot.push(response.plays);
            if (state.pot.length > 3){
                state.pot.shift();
            }
            state.players[response.actor].stackSize -= 1;
       }
       if (response.hasOwnProperty("order")){
            state.order = response.order;
            state.players = {};
            state.order.forEach((e, i) => {
                state.players[e] = new Player(e, i, 0);
            });
       }
       if (response.hasOwnProperty("turn")){
            state.turn = response.turn;
       }
       if (response.hasOwnProperty("wins_pot")){
            state.message = response.wins_pot;
            state.pot = [];
       }
       if (response.hasOwnProperty("youare")){
            state.self = response.youare;
       }
       if (response.hasOwnProperty("stacks")){
            Object.entries(response.stacks).forEach(([key, value]) => {
                state.players[key].stackSize = value;
            })
       }
       if (response.hasOwnProperty("reset")){
            state.order = response.reset;
            state.players = {};
            state.order.forEach((e, i) => {
                state.players[e] = new Player(e, i, 0);
            });
            state.pot = [];
            state.pot_size = 0;
       }
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