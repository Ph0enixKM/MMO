import Player from './player';
import Entity from './entity';

const SCALING_FACTOR = 2;

export default class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private entities: Entity[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Could not get canvas context');
        }
        this.context = ctx;
        // This sets the scaling factor
        ctx.canvas.width = SCALING_FACTOR * canvas.width;
        ctx.canvas.height = SCALING_FACTOR * canvas.height;
        ctx.scale(SCALING_FACTOR, SCALING_FACTOR);
        this.entities.push(new Player(100, 100));
        this.mainLoop();
    }

    public draw(): void {
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.width, this.height);
        for (const entity of this.entities) {
            entity.draw(this.context);
        }
    }

    public mainLoop(): void {
        this.draw();
        requestAnimationFrame(() => this.mainLoop());
    }
}

new World(document.getElementById('main') as HTMLCanvasElement)