# MMO
Simple MMO Game that is trying to replicate the infamous [Everybody Edits](https://everybodyedits.com).

## Architecture

This project consists of two main parts:
- **Frontend**: A Vite-powered TypeScript application for the game client
- **Backend**: An Express.js server with WebSocket support and PostgreSQL database

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

### Installation

#### Quick Setup (Linux/Mac)
```bash
./setup.sh
```

#### Manual Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb mmo

# Configure database connection
cp .env.example .env
# Edit .env with your database credentials
```

3. Start the backend server:
```bash
npm run server
```

4. In another terminal, start the frontend development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

Build the frontend:
```bash
npm run build
```

See [server/README.md](server/README.md) for more details about the backend server.


