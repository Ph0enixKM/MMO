# Migration from AWS to Express.js + PostgreSQL

## Overview
This project has been migrated from AWS Lambda + DynamoDB + API Gateway WebSocket to Express.js + PostgreSQL.

## What Changed

### Before (AWS Architecture)
- **Backend**: AWS Lambda function handling WebSocket events
- **Database**: DynamoDB for storing blocks and user data
- **WebSocket**: AWS API Gateway WebSocket API
- **Deployment**: Lambda deployment via aws.amber script

### After (Current Architecture)
- **Backend**: Express.js server with WebSocket support (ws library)
- **Database**: PostgreSQL for storing blocks
- **WebSocket**: Native WebSocket server integrated with Express.js
- **Features**: 
  - CORS enabled for cross-origin requests
  - Automatic database table creation on startup
  - Environment-based configuration
  - Health check endpoint

## Migration Details

### Database Schema
The PostgreSQL `blocks` table replaces DynamoDB tables:
```sql
CREATE TABLE blocks (
    coord VARCHAR(50) PRIMARY KEY,  -- Format: "x:y"
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL
);
```

### WebSocket Events
All WebSocket events remain the same:
- `setName` - Player joins the game
- `move` - Player movement
- `build` - Place a block
- `remove` - Remove a block
- `message` - Chat message

### Configuration
Database and server configuration is now managed via environment variables (`.env` file):
- `DB_USER` - PostgreSQL username
- `DB_HOST` - Database host (use 127.0.0.1 for local)
- `DB_NAME` - Database name
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port
- `PORT` - Server port

### Legacy Files
The following files are no longer used but kept for reference:
- `aws/lambda.js` - Original AWS Lambda function
- `aws.amber` - AWS deployment script

## Setup Instructions

See [README.md](README.md) for setup instructions.

For server-specific documentation, see [server/README.md](server/README.md).
