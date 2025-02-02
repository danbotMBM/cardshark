export class Your_Deck {
    constructor(x, y, sprite, hitbox){
        this.x = x;
        this.y = y;
        this.deck_sprite = sprite;
        this.deck_sprite.index = 0;
        this.deck_sprite.scale_x = .1;
        this.deck_sprite.scale_y = .1;
        this.deck_sprite.x = this.x;
        this.deck_sprite.y = this.y;
        this.play_card_button = hitbox; 
        this.play_card_button.linked_to_img = this.deck_sprite;
        this.player = null;
    }

    draw(ctx){
        if (this.player != null && this.player.stack_size > 0){
            this.deck_sprite.draw(ctx);
            ctx.fillText(this.player.stack_size, this.x, this.y);
        }
    }
}