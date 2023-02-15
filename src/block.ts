import Entity from './entity';

export default class Block extends Entity {
    public color: string = '#888';

    constructor(x: number, y: number, color: string) {
        super(x, y);
        this.color = color;
    }

    public isClicked(x: number, y: number): boolean {
        return x >= this.x && x <= this.x + this.size && y >= this.y && y <= this.y + this.size;
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.size, this.size);
    }
}