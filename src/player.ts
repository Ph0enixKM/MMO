import Entity from './entity';

export default class Player extends Entity {
    private speed: number = 1;
    private direction: number = 0;
    private color: string = '#ffffff';
    private keymap: boolean[] = [false, false, false, false];
    private vector: number[] = [0, 0, 0, 0];
    private friction: number = 0.7;
    
    constructor(x: number, y: number) {
        super(x, y, 10);
        window.addEventListener('keydown', (e) => this.setKey(e, true));
        window.addEventListener('keyup', (e) => this.setKey(e, false));
    }

    public setKey(event: KeyboardEvent, state: boolean) {
        switch (event.key) {
            case 'w':
                this.keymap[0] = state;
                break;
            case 'a':
                this.keymap[1] = state;
                break;
            case 's':
                this.keymap[2] = state;
                break;
            case 'd':
                this.keymap[3] = state;
                break;
        }
    }

    public draw(context: CanvasRenderingContext2D): void {
        // Add inertia
        this.vector[0] *= this.friction;
        this.vector[1] *= this.friction;
        this.vector[2] *= this.friction;
        this.vector[3] *= this.friction;
        // Add input
        if (this.keymap[0]) {
            this.vector[0] += this.speed;
        }
        if (this.keymap[1]) {
            this.vector[1] += this.speed;
        }
        if (this.keymap[2]) {
            this.vector[2] += this.speed;
        }
        if (this.keymap[3]) {
            this.vector[3] += this.speed;
        }
        // Move
        this.move(this.vector[3] - this.vector[1], this.vector[2] - this.vector[0]);
        // Draw
        super.draw(context);
    }
}