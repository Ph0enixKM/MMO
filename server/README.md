# MMO Server

This is the Express.js server with WebSocket support for the MMO game.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a PostgreSQL database:
```bash
createdb mmo
```

3. Copy `.env.example` to `.env` and configure your database connection:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mmo
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000
```

## Running the Server

Start the server:
```bash
npm run server
```

The server will:
- Create necessary database tables automatically
- Start the WebSocket server on the configured port (default: 3000)
- Enable CORS for cross-origin requests

## API Endpoints

- `GET /health` - Health check endpoint

## WebSocket Events

The server handles the following WebSocket actions:

- `setName` - Set player name and join the game
- `move` - Update player position
- `build` - Place a block
- `remove` - Remove a block
- `message` - Send a chat message
