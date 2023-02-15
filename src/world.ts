import Player from './player';
import Block from './block';

export const GRID_SIZE = 20;
export const MAP_SIZE = 2000;
const URL = 'wss://08ohe3ecjh.execute-api.eu-central-1.amazonaws.com/production/'
type BuildMode = 'build' | 'remove';

export default class World {
    private canvas: HTMLCanvasElement;
    private connectBtn: HTMLButtonElement;
    private messageInput: HTMLInputElement;
    private chatBox: HTMLDivElement;

    private context: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private players: Map<string, Player> = new Map();
    private blocks: Block[] = [];
    private ws: WebSocket | null = null;
    private playerName: string = '';
    private buildMode: BuildMode = 'build';
    private color: string = 'white';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        // This sets the scaling factor
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.ws = null;
        this.connectBtn = document.getElementById('connect') as HTMLButtonElement;
        this.messageInput = document.getElementById('message') as HTMLInputElement;
        this.chatBox = document.getElementById('chatbox') as HTMLDivElement;
        this.connectSetup();
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Could not get canvas context');
        }
        this.context = ctx;
        this.mainLoop();
        this.setupChat();
    }

    private handleBuilding(): void {
        const toolbar = document.getElementById('toolbar') as HTMLDivElement;
        const build = document.getElementById('build') as HTMLButtonElement;
        const remove = document.getElementById('remove') as HTMLButtonElement;
        toolbar.style.display = 'block';
        build.addEventListener('click', () => {
            build.classList.add('active');
            remove.classList.remove('active');
            this.buildMode = 'build';
        });
        remove.addEventListener('click', () => {
            remove.classList.add('active');
            build.classList.remove('active');
            this.buildMode = 'remove';
        });
        // Fire event when clicked and mouse moves
        let isMouseDown = false;
        this.canvas.addEventListener('mousemove', (e) => isMouseDown && this.buildBlock(e));
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            this.buildBlock(e)
        });
        this.canvas.addEventListener('mouseup', () => isMouseDown = false);
    }

    private buildBlock(e: MouseEvent): void {
        // Calculate the x and y position of the block based on the mouse position and player position
        const x = Math.floor((e.offsetX + this.players.get(this.playerName)!.x - this.width / 2) / GRID_SIZE) * GRID_SIZE;
        const y = Math.floor((e.offsetY + this.players.get(this.playerName)!.y - this.height / 2) / GRID_SIZE) * GRID_SIZE;
        if (this.buildMode === 'build') {
            // If block is out of bounds, don't build it
            if (x < 0 || x > MAP_SIZE || y < 0 || y > MAP_SIZE) return;
            // If block already exists, don't build it
            if (this.blocks.find((block) => block.x === x && block.y === y)) return;
            const block = new Block(x, y, this.color);
            this.blocks.push(block);
            this.ws?.send(JSON.stringify({ action: 'build', x: block.x, y: block.y, color: block.color }));
        }
        else {
            const block = this.blocks.find((block) => block.isClicked(x + GRID_SIZE / 2, y + GRID_SIZE / 2));
            console.log(block);
            if (block) {
                this.blocks.splice(this.blocks.indexOf(block), 1);
                this.ws?.send(JSON.stringify({ action: 'remove', x: block.x, y: block.y }));
            }
        }
    }

    private handleColorPalette(): void {
        const red = document.getElementById('red') as HTMLButtonElement;
        const orange = document.getElementById('orange') as HTMLButtonElement;
        const yellow = document.getElementById('yellow') as HTMLButtonElement;
        const green = document.getElementById('green') as HTMLButtonElement;
        const blue = document.getElementById('blue') as HTMLButtonElement;
        const purple = document.getElementById('purple') as HTMLButtonElement;
        const white = document.getElementById('white') as HTMLButtonElement;
        const gray = document.getElementById('gray') as HTMLButtonElement;
        const colors = [red, orange, yellow, green, blue, purple, white, gray];
        colors.forEach((color) => {
            color.addEventListener('click', () => {
                this.color = color.id;
                colors.forEach((c) => c.classList.remove('active'));
                color.classList.add('active');
            });
        });
    }

    private resizeCanvas(): void {
        this.canvas.width = parseInt(window.innerWidth.toFixed());
        this.canvas.height = parseInt(window.innerHeight.toFixed());
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    private setupChat(): void {
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.messageInput.value !== '') {
                    this.ws?.send(JSON.stringify({ action: 'message', message: this.messageInput.value }));
                    this.messageInput.value = '';
                }
            }
        });
    }

    private webSocketSetup(): void {
        this.ws!.onopen = () => {
            this.connectBtn.innerText = 'Connected';
            this.connectBtn.disabled = true;
            let name = null;
            while (name === null || name === '') {
                name = prompt('Enter your name');
            }
            this.ws!.send(JSON.stringify({ action: 'setName', name }));
            this.playerName = name;
            this.players.set(name, new Player(100, 100, name, true, this.ws));
            this.handleBuilding();
            this.handleColorPalette();
        };
        this.ws!.onmessage = (event) => {
            const { type, message, name, x, y, data } = JSON.parse(event.data);
            console.log(event.data);
            
            let p = document.createElement('div');
            switch (type) {
                case 'serverMessage':
                    console.log(message);
                    p.innerText = message;
                    p.className = 'server'
                    this.chatBox.appendChild(p);
                    this.chatBox.scrollTop = this.chatBox.scrollHeight;
                    break;
                case 'message':
                    console.log(message);
                    p.innerText = `${name}: ${message}`;
                    this.chatBox.appendChild(p);
                    this.chatBox.scrollTop = this.chatBox.scrollHeight;
                    break;
                case 'move':
                    if (name === this.playerName) {
                        this.players.get(name)!.onWebSocketMove(event.data);
                    }
                    else if (this.players.has(name)) {
                        this.players.get(name)!.setPositon(x, y);
                    }
                    break;
                case 'playerJoined':
                    if (name === this.playerName) return;
                    this.players.set(name, new Player(100, 100, name, false, null));
                    break;
                case 'playerLeft':
                    this.players.delete(name);
                    break;
                case 'allPlayers':
                    console.log(data);
                    for (const playerName of data) {
                        if (playerName === this.playerName) continue;
                        this.players.set(playerName, new Player(100, 100, playerName, false, null));
                    }
                    break;
                case 'addBlocks':
                    console.log('addBlocks', data);
                    for (const block of data) {
                        this.blocks.push(new Block(parseInt(block.x), parseInt(block.y), block.color));
                    }
                    break;
                case 'build':
                    if (this.blocks.find((block) => block.x === parseInt(x) && block.y === parseInt(y))) return;
                    this.blocks.push(new Block(x, y, data));
                    break;
                case 'remove':
                    const block = this.blocks.find((block) => block.x === parseInt(x) && block.y === parseInt(y));
                    if (block) {
                        this.blocks.splice(this.blocks.indexOf(block), 1);
                    }
                    break;
                default:
                    console.log('Unknown message type');
            }
        };
        this.ws!.onclose = () => {
            this.connectBtn.innerText = 'Connect';
            this.connectBtn.disabled = false;
        };
        window.addEventListener("beforeunload", () => {
            this.ws!.close();
        });
    }

    private connectSetup(): void {
        this.connectBtn.addEventListener('click', () => {
            if (this.connectBtn.disabled) return;
            this.connectBtn.disabled = true;
            this.connectBtn.innerText = 'Connecting...';
            this.ws = new WebSocket(URL);
            this.webSocketSetup();
        });
    }

    public draw(): void {
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.width, this.height);
        this.context.save();
        const player = this.players.get(this.playerName);
        if (player) {
            this.context.translate(this.width / 2 - player.x, this.height / 2 - player.y);
        }

        // Draw map borders
        this.context.strokeStyle = '#888';
        this.context.lineWidth = 5;
        // Set line to be outside of the map
        this.context.strokeRect(-5, -5, MAP_SIZE + 10, MAP_SIZE + 10);
        // this.context.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

        for (const block of this.blocks) {
            block.draw(this.context);
        }

        for (const player of this.players.values()) {
            if (player.name === this.playerName) continue;
            player.draw(this.context);
        }

        this.context.restore();
        player?.draw(this.context);
    }

    public mainLoop(): void {
        this.draw();
        requestAnimationFrame(this.mainLoop.bind(this));
    }
}