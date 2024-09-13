import { Sprite }  from './src/sprites.js';
import { SpriteSheet } from './src/sprites.js';
import { Hitbox } from './src/hitboxes.js';


function test(msg){
    console.log(msg);
}

const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d');
var clickable = [];
const cards_sprite_sheet = new SpriteSheet('cards.png', 73, 98, 52, 13);
const card = new Sprite(cards_sprite_sheet);
const card_box = new Hitbox(card.x, card.y, card.visual_width(), card.visual_height(), test, "test");
card_box.linked_to_img = card;
clickable.push(card_box);

// set up clicking
canvas.addEventListener('click', function(event) {
    // Get the click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    for (let i = 0; i < clickable.length; i++) {
        let e = clickable[i];
        if (e.linked_to_img != null) e.update_to_link();
        if(e.check_is_within(clickX, clickY)) {
                e.f(e.params);
                break;
        }
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
var t = 0
// TODO check frame rate
function draw_frame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    card.rotation += 1;
    card.x = t % 200;
    card.y = t % 50;
    t+=1;
    card.draw(ctx);
    document.getElementById('debug_place').textContent = `${mousex}, ${mousey}`;
    requestAnimationFrame(draw_frame);
}
requestAnimationFrame(draw_frame);