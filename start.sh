#!/bin/bash

# MQ Monitor Start Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/mq-monitor.pid"
LOG_FILE="$SCRIPT_DIR/logs/mq-monitor.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "MQ Monitor is already running with PID $PID"
        exit 1
    else
        echo "Removing stale PID file..."
        rm "$PID_FILE"
    fi
fi

echo "Starting MQ Monitor Service..."

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if dist folder exists (compiled TypeScript)
if [ ! -d "dist" ]; then
    echo "Building application..."
    npm run build
fi

# Set environment variables
export NODE_ENV=production
export PORT=5002

# Start the application in background
echo "Starting NestJS application on port $PORT in background..."
nohup npm run start:prod >> "$LOG_FILE" 2>&1 &

# Save PID
PID=$!
echo $PID > "$PID_FILE"

# Wait a moment to check if the process started successfully
sleep 2

if ps -p $PID > /dev/null; then
    echo "MQ Monitor started successfully with PID $PID"
    echo "Logs: tail -f $LOG_FILE"
    echo "To stop: ./stop.sh"
else
    echo "Failed to start MQ Monitor. Check logs at $LOG_FILE"
    rm "$PID_FILE"
    exit 1
fi