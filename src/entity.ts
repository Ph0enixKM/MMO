export default class Entity {
    private x: number;
    private y: number;
    private width: number

    constructor(x: number, y: number, width: number) {
        this.x = x;
        this.y = y;
        this.width = width;
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = '#ffffff';
        context.fillRect(this.x, this.y, this.width, this.width);
    }

    public move(xOffset: number, yOffset: number): void {
        this.x += xOffset;
        this.y += yOffset;
    }
}