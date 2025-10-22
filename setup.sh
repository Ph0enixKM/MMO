#!/bin/bash

# MMO Server Setup Script

set -e

echo "=== MMO Server Setup ==="
echo

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✓ PostgreSQL is installed"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw mmo; then
    echo "✓ Database 'mmo' already exists"
else
    echo "Creating database 'mmo'..."
    createdb mmo
    echo "✓ Database 'mmo' created"
fi

# Check if .env exists
if [ -f .env ]; then
    echo "✓ .env file already exists"
else
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please edit .env with your database credentials"
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo
echo "=== Setup Complete ==="
echo
echo "To start the server, run:"
echo "  npm run server"
echo
echo "To start the frontend development server, run:"
echo "  npm run dev"
echo
echo "Don't forget to configure your .env file if needed!"
