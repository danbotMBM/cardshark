export class Hitbox {
    constructor(x, y, width, height, f, params){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.f = f;
        this.params = params;
        this.linked_to_img = null;
    }

    // check if the point (xpos, ypos) is within this hitbox
    check_is_within(xpos, ypos){
        if (this.rotation == 0){
            if (xpos >= this.x && xpos <= this.x + this.width &&
                ypos >= this.y && ypos <= this.y + this.height) {
                return true;
            }
        }
        var polygon = this.to_polygon();
        return inside_polygon([xpos, ypos], polygon);
    }
    
    get_center(){
        return [this.x + this.width / 2, this.y + this.height / 2];
    }
    
    to_polygon(){
        var points = [];
        var center = this.get_center();
        points.push(rotate_point([this.x, this.y], center, this.rotation));
        points.push(rotate_point([this.x + this.width, this.y], center, this.rotation));
        points.push(rotate_point([this.x + this.width, this.y + this.height], center, this.rotation));
        points.push(rotate_point([this.x, this.y + this.height], center, this.rotation));
        return points;
    }

    update_to_link(){
        this.x = this.linked_to_img.x;
        this.y = this.linked_to_img.y;
        this.width = this.linked_to_img.visual_width();
        this.height = this.linked_to_img.visual_height();
        this.rotation = this.linked_to_img.rotation;
    }
    
    draw(ctx){
        this.update_to_link();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';;
        // change the context point to be the center of the sprite for rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        // apply the rotation in degrees
        ctx.rotate(this.rotation * Math.PI / 180);
        // draw just the sprite at the given index
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        //reset the rotation and sprite center transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
}

function rotate_point(point, center, angle) {
    const [px, py] = point;
    const [cx, cy] = center;

    const radians = (Math.PI / 180) * angle;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Translate point back to origin
    const tx = px - cx;
    const ty = py - cy;

    // Rotate the point
    const newX = tx * cos - ty * sin;
    const newY = tx * sin + ty * cos;

    // Translate point back
    return [newX + cx, newY + cy];
}

function inside_polygon(point, polygon){
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
                          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}