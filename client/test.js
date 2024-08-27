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
const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d'); 
class BoundingBox {
    constructor(x, y, w, h, f, p){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.f = f;
        this.p = p;
    }
}

canvas.addEventListener('click', function(event) {
    // Get the click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if the click is within the sprite's boundaries
    boxes.forEach((b, i) => {
        if (clickX >= b.x && clickX <= b.x + b.w &&
            clickY >= b.y && clickY <= b.y + b.h) {
            b.f(b.p);
        }
        
    });
});
var mousex = 0;
var mousey = 0;
canvas.addEventListener('mousemove', function(event){
    const rect = canvas.getBoundingClientRect();
    mousex = event.clientX - rect.left;
    mousey = event.clientY - rect.top; 
});

const BASE_W = 1280;
const BASE_H = 720;
function resize_canvas(){
    const aspectRatio = 16 / 9;

    let width = window.innerWidth * 3/4;
    let height = window.innerHeight * 3/4;

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

    boxes = [new BoundingBox(canvas.width/2 - cards.width/2, canvas.height/2 - cards.height/2 , 100, 100, send_cmd, "slap"), new BoundingBox(canvas.width - 100, 0, 200, canvas.height, send_cmd, "play")];
    ctx.fillStyle = 'black'; // Set the text color
    ctx.textAlign = 'center'; // Set text alignment
    ctx.textBaseline = 'middle'; // Set the baseline alignment
}
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
window.addEventListener('resize', resize_canvas);
function draw_debug(){
    ctx.fillText("width: " + canvas.width + "height: " + canvas.height, canvas.width / 2, canvas.height / 2);
    document.getElementById('debug_place').textContent = `${mousex}, ${mousey}`;
}

function draw_player(player, player_pos, num_players, self_id, turn){
    xpos = (player_pos + 1) * (canvas.width) / (num_players + 1);
    ypos = 0;
    ctx.fillStyle = 'blue';
    if (player.id == self_id){
        // this is this browser's player
        ctx.fillStyle = 'green';
    }
    ctx.fillRect(xpos, ypos, 50, 50);
    if (player_pos == turn) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(xpos, ypos, 50, 50);
    }
    ctx.font = `20px Arial`;
    ctx.fillStyle = 'black'; // Set the text color
    ctx.textAlign = 'left'; // Set text alignment
    ctx.textBaseline = 'top'; // Set the baseline alignment
    ctx.fillText(player.stackSize, xpos, ypos);
    ctx.fillText(player.name, xpos, ypos + 30);
}

var boxes = [new BoundingBox(canvas.width/2 - cards.width/2, canvas.height/2 - cards.height/2 , 100, 100, send_cmd, "slap"), new BoundingBox(canvas.width - 100, 0, 200, canvas.height, send_cmd, "play")];
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
    for (let i = 0; i< order.length; i++){
        const player = players[order[i]];
        const player_pos = i;
        draw_player(player, player_pos, order.length, self_id, turn);
    }
    
}
function draw_pot(pot){
    pot_area = document.getElementById("play_space");
    if (pot.length > 0) pot_area.innerHTML = pot;
    else pot_area.innerHTML = "";
    state.pot.forEach(function(e, i){
        draw_sprite(ctx, cards,canvas.width/2 - cards.width/2 + i *20, canvas.height/2 - cards.height/2 + i *20, e); 
    });
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
       if (response.hasOwnProperty("name") && response.hasOwnProperty("rename")){
            state.players[response.rename].name = response.name;
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
resize_canvas();