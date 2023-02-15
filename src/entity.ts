import { GRID_SIZE } from "./world";

export default class Entity {
    public x: number;
    public y: number;
    protected size: number

    constructor(x: number, y: number, size: number = GRID_SIZE) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = '#ffffff';
        context.fillRect(this.x, this.y, this.size, this.size);
    }

    public move(xOffset: number, yOffset: number): void {
        this.x += xOffset;
        this.y += yOffset;
    }

    public setPositon(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}