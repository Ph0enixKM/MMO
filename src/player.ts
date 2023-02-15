import Entity from './entity';
import { GRID_SIZE, MAP_SIZE } from './world';

export default class Player extends Entity {
    private speed: number = 1;
    private keymap: boolean[] = [false, false, false, false];
    public vector: number[] = [0, 0, 0, 0];
    private friction: number = 0.9;
    public name: string = '';

    private controlled: boolean = false;
    private ws: WebSocket | null = null;
    private lastMove: number = 0;
    private last_x: number = 0;
    private last_y: number = 0;
    private ping: number = 0;

    private x_anim: number;
    private y_anim: number;
    
    constructor(x: number, y: number, name: string, controlled: boolean, ws: WebSocket | null) {
        super(x, y);
        this.name = name;
        this.controlled = controlled;
        this.ws = ws;
        this.x_anim = this.last_x = x;
        this.y_anim = this.last_y = y;
        if (this.controlled) {
            window.addEventListener('keydown', (e) => this.setKey(e, true));
            window.addEventListener('keyup', (e) => this.setKey(e, false));
            setInterval(() => {
                if (this.last_x === this.x && this.last_y === this.y) return;
                if (Date.now() - this.lastMove > 3000) {
                    this.ping = Date.now() - this.lastMove;
                    console.log('Ping: ' + this.ping);
                    this.lastMove = Date.now();
                    this.last_x = this.x;
                    this.last_y = this.y;
                    // console.log('Sent move');
                    this.ws?.send(JSON.stringify({ action: 'move', x: Math.round(this.x), y: Math.round(this.y) }));
                }
            }, 1000);
        }
    }

    public onWebSocketMove(data: string): void {
        const { type, name } = JSON.parse(data);
        if ((type === 'move' && name === this.name) || (this.lastMove < Date.now() - 2000)) {
            if (this.last_x === this.x && this.last_y === this.y) return;
            setTimeout(() => {
                this.ping = Date.now() - this.lastMove;
                console.log('Ping: ' + this.ping);
                this.lastMove = Date.now();
                this.last_x = this.x;
                this.last_y = this.y;
                // console.log('Sent move');
                this.ws?.send(JSON.stringify({ action: 'move', x: Math.round(this.x), y: Math.round(this.y) }));
            }, 500);
        }
    }

    public setKey(event: KeyboardEvent, state: boolean) {
        // check if message box is not focused
        if (document.activeElement?.id === 'message') return;
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.keymap[0] = state;
                break;
            case 'ArrowLeft':
            case 'a':
                this.keymap[1] = state;
                break;
            case 'ArrowDown':
            case 's':
                this.keymap[2] = state;
                break;
            case 'ArrowRight':
            case 'd':
                this.keymap[3] = state;
                break;
        }
    }

    private drawActor(context: CanvasRenderingContext2D, x: number, y: number): void {
        context.textAlign = 'center';
        context.font = 'bold 32px Arial';
        context.fillText('😃', x + GRID_SIZE / 2, y + GRID_SIZE / 2 + 16);
        // Display name under the player with a black outline
        context.font = 'bold 12px Arial';
        context.strokeStyle = '#00000088';
        context.lineWidth = 2;
        context.strokeText(this.name, x + GRID_SIZE / 2, y + this.size + GRID_SIZE);
        // Display name under the player
        context.fillStyle = '#ffffff';
        context.fillText(this.name, x + GRID_SIZE / 2, y + this.size + GRID_SIZE);
    }

    public draw(context: CanvasRenderingContext2D): void {
        if (this.controlled) {
            this.vector = this.vector.map((v) => v * this.friction);
            if (this.keymap[0]) this.vector[0] += this.speed;
            if (this.keymap[1]) this.vector[1] += this.speed;
            if (this.keymap[2]) this.vector[2] += this.speed;
            if (this.keymap[3]) this.vector[3] += this.speed;
            // Check if player is out of bounds
            if (this.x - 16 + this.vector[1] < 0) {
                this.vector[1] = 0;
            }
            if (this.x + this.vector[3] > MAP_SIZE - this.size) {
                this.vector[3] = 0;
            }
            if (this.y - 8 + this.vector[0] < 0) {
                this.vector[0] = 0;
            }
            if (this.y + this.vector[2] > MAP_SIZE - this.size) {
                this.vector[2] = 0;
            }
            

            // Move
            this.move(this.vector[3] - this.vector[1], this.vector[2] - this.vector[0]);
            // Draw
            this.drawActor(context, window.innerWidth / 2, window.innerHeight / 2);
            
        } else {
            // Move animation to target x and y
            if (this.x_anim !== this.x || this.y_anim !== this.y) {
                this.x_anim += (this.x - this.x_anim) / 10;
                this.y_anim += (this.y - this.y_anim) / 10;
                if (Math.abs(this.x - this.x_anim) < 1) {
                    this.x_anim = this.x;
                }
                if (Math.abs(this.y - this.y_anim) < 1) {
                    this.y_anim = this.y;
                }
            }
            this.drawActor(context, this.x_anim, this.y_anim);
        }
    }
}