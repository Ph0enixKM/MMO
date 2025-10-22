const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mmo',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// In-memory storage for active WebSocket connections
const users = new Map(); // connectionId -> username
const connections = new Map(); // connectionId -> WebSocket

// Initialize database tables
async function initDatabase() {
    try {
        // Create blocks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blocks (
                coord VARCHAR(50) PRIMARY KEY,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                color VARCHAR(50) NOT NULL
            )
        `);
        
        console.log('Database tables initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    }
}

// Database helper functions
async function DBgetBlocks() {
    try {
        const result = await pool.query('SELECT x, y, color FROM blocks');
        return result.rows;
    } catch (err) {
        console.error('Error getting blocks:', err);
        return [];
    }
}

async function DBaddBlock(x, y, color) {
    try {
        await pool.query(
            'INSERT INTO blocks (coord, x, y, color) VALUES ($1, $2, $3, $4) ON CONFLICT (coord) DO UPDATE SET color = $4',
            [`${x}:${y}`, x, y, color]
        );
    } catch (err) {
        console.error('Error adding block:', err);
    }
}

async function DBremoveBlock(x, y) {
    try {
        await pool.query('DELETE FROM blocks WHERE coord = $1', [`${x}:${y}`]);
    } catch (err) {
        console.error('Error removing block:', err);
    }
}

async function DBcountBlocks() {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM blocks');
        return parseInt(result.rows[0].count);
    } catch (err) {
        console.error('Error counting blocks:', err);
        return 0;
    }
}

// WebSocket message sending helpers
function sendMessage(connectionIds, body) {
    connectionIds.forEach(id => {
        const ws = connections.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(body));
                console.log(`Sent to ${id}`);
            } catch (err) {
                console.error(`Error sending to ${id}:`, err);
                users.delete(id);
                connections.delete(id);
            }
        }
    });
}

function sendToAll(body) {
    sendMessage(Array.from(connections.keys()), body);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    const connectionId = `${Date.now()}-${Math.random()}`;
    connections.set(connectionId, ws);
    console.log(`New connection: ${connectionId}`);

    ws.on('message', async (message) => {
        try {
            const body = JSON.parse(message);
            const { action } = body;
            
            console.log(`Received action: ${action} from ${connectionId}`);

            switch (action) {
                case 'setName': {
                    const { name } = body;
                    users.set(connectionId, name);
                    
                    // Get all blocks and send in chunks
                    const blocks = await DBgetBlocks();
                    const chunkSize = 1000;
                    const chunks = [];
                    for (let i = 0; i < blocks.length; i += chunkSize) {
                        chunks.push(blocks.slice(i, i + chunkSize));
                    }
                    
                    // Send welcome messages and player list
                    sendToAll({
                        type: 'serverMessage',
                        message: `${name} joined the game`
                    });
                    
                    sendToAll({
                        type: 'playerJoined',
                        name: name
                    });
                    
                    sendMessage([connectionId], {
                        type: 'allPlayers',
                        data: Array.from(users.values())
                    });
                    
                    // Send blocks in chunks
                    for (const chunk of chunks) {
                        sendMessage([connectionId], {
                            type: 'addBlocks',
                            data: chunk
                        });
                    }
                    break;
                }
                
                case 'move': {
                    const { x, y } = body;
                    const name = users.get(connectionId);
                    if (name) {
                        sendToAll({
                            type: 'move',
                            x: x,
                            y: y,
                            name: name
                        });
                    }
                    break;
                }
                
                case 'build': {
                    const { x, y, color } = body;
                    await DBaddBlock(x, y, color);
                    sendToAll({
                        type: 'build',
                        x: x,
                        y: y,
                        data: color
                    });
                    break;
                }
                
                case 'remove': {
                    const { x, y } = body;
                    const blocks = await DBgetBlocks();
                    const block = blocks.find(b => 
                        parseInt(b.x) === x && parseInt(b.y) === y
                    );
                    
                    if (block) {
                        console.log("Found a block to be removed");
                        await DBremoveBlock(x, y);
                        sendToAll({
                            type: 'remove',
                            x: x,
                            y: y
                        });
                    } else {
                        console.log('Could not find the block :(');
                    }
                    break;
                }
                
                case 'message': {
                    const { message } = body;
                    const name = users.get(connectionId);
                    if (name) {
                        sendToAll({
                            type: 'message',
                            message: message,
                            name: name
                        });
                    }
                    break;
                }
                
                default:
                    sendToAll({
                        type: 'unknown command'
                    });
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', async () => {
        const name = users.get(connectionId);
        if (name) {
            console.log(`User ${name} disconnected`);
            sendToAll({
                type: 'serverMessage',
                message: `${name} disconnected`
            });
            sendToAll({
                type: 'playerLeft',
                name: name
            });
        }
        users.delete(connectionId);
        connections.delete(connectionId);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        users.delete(connectionId);
        connections.delete(connectionId);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDatabase();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`WebSocket server is ready`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
