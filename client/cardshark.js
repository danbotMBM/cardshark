import { Sprite }  from './src/sprites.js';
import { SpriteSheet } from './src/sprites.js';

const canvas = document.getElementById("play_canvas");
const ctx = canvas.getContext('2d');
const cards_sprite_sheet = new SpriteSheet('cards.png', 73, 98, 52, 13);
const cards = new Sprite(cards_sprite_sheet);
function draw_frame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cards.rotation = 10;
    cards.draw(ctx);
    requestAnimationFrame(draw_frame);
}
requestAnimationFrame(draw_frame);