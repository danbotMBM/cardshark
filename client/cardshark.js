import { Sprite }  from './src/sprites.js';
import { SpriteSheet } from './src/sprites.js';
import { Hitbox } from './src/hitboxes.js';
import { is_iterable } from './src/utils.js';

function test(msg){
    console.log(msg);
}

const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d');
var clickable = [];
const cards_sprite_sheet = new SpriteSheet('cards.png', 73, 98, 52, 13);
const card = new Sprite(cards_sprite_sheet);
const card_box = new Hitbox(card.x, card.y, card.visual_width(), card.visual_height(), test, "test");
const draw_objects = [];
card_box.linked_to_img = card;
for (let i = 0; i < 52; i++){
    const e = new Sprite(cards_sprite_sheet);
    e.index = i;
    const b = new Hitbox(e.x, e.y, e.visual_width(), e.visual_height(), test, "test" + i);
    b.linked_to_img = e;
    clickable.push(b);
    e.x = i % 13 * 50;
    e.y = Math.floor(i / 13) * 50;
    draw_objects.push(e);
}

// set up clicking
canvas.addEventListener('click', function(event) {
    // Get the click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    for (let i = clickable.length - 1; i >= 0; i--) {
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

card.scale_x = 2;
card.scale_y = 2;

function draw_recursive(obj){
    if (is_iterable(obj)){
        for (const elem of obj){
            draw_recursive(elem);
        }
    }else{
        obj.draw(ctx);
    }
}
function do_recurive(obj, func){
    if (is_iterable(obj)){
        for (const elem of obj){
            do_recurive(elem, func);
        }
    }else{
        func(obj);
    }
}

var show_hitboxes = true;
function draw_frame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_recursive(draw_objects);
    if (show_hitboxes) draw_recursive(clickable);
    do_recurive(draw_objects, (e) => {
        e.rotation +=1; 
        e.x = e.x +.1 % 200 ;
    });
    document.getElementById('debug_place').textContent = `(mousex, mousey): (${mousex}, ${mousey})`;
    calculate_fps(performance.now());
    requestAnimationFrame(draw_frame);
}
requestAnimationFrame(draw_frame);