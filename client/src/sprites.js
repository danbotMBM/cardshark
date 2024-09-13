export class Sprite {
    constructor(sprite_sheet) {
        this.sprite_sheet = sprite_sheet; 
        this.index = 0; // which sprite is currently showing
        this.x = 0;
        this.y = 0;
        this.scale_x = 1;
        this.scale_y = 1;
        this.rotation = 0;
    }
    visual_width(){
        return this.sprite_sheet.width * this.scale_x;
    }
    visual_height(){
        return this.sprite_sheet.height * this.scale_y;
    }
    draw(ctx){
        const index = this.index;
        if (this.sprite_sheet.loaded && index < this.sprite_sheet.length){
            const sprite_x_coord = (index % this.sprite_sheet.num_in_row) * this.sprite_sheet.width;
            const sprite_y_coord = Math.trunc(index / this.sprite_sheet.num_in_row) * this.sprite_sheet.height;
            const vw = this.visual_width()
            const vh = this.visual_height()
            // change the context point to be the center of the sprite for rotation
            ctx.translate(this.x + vw / 2, this.y + vh / 2);
            // apply the rotation in degrees
            ctx.rotate(this.rotation * Math.PI / 180);
            // draw just the sprite at the given index
            ctx.drawImage(this.sprite_sheet.img, sprite_x_coord, sprite_y_coord, this.sprite_sheet.width, this.sprite_sheet.height, -vw/2, -vh/2, vw, vh);
            //reset the rotation and sprite center transformation
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}

export class SpriteSheet {
    constructor(img_src, width, height, length, num_in_row){
        this.src = img_src;
        this.length = length; // number of sprites total in the image
        this.num_in_row = num_in_row; // number of sprites in one row of the image
        this.width = width;
        this.height = height;
        
        // logic for loading image
        this.loaded = false // says when image is loaded
        this.img = new Image();
        self = this;
        this.img.onload = function(){self.loaded = true};
        this.img.src = img_src;
    }
}
