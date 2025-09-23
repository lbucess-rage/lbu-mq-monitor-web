#!/bin/bash

# MQ Monitor Development Start Script

echo "Starting MQ Monitor in Development Mode..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Set environment variables
export NODE_ENV=development
export PORT=5002

# Start the application in watch mode
echo "Starting NestJS application in watch mode on port $PORT..."
npm run start:dev