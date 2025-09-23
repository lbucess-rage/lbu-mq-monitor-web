#!/bin/bash

# MQ Monitor Stop Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/mq-monitor.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "MQ Monitor is not running (PID file not found)"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping MQ Monitor (PID: $PID)..."
    kill -TERM $PID

    # Wait for graceful shutdown (max 10 seconds)
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            echo "MQ Monitor stopped successfully"
            rm "$PID_FILE"
            exit 0
        fi
        sleep 1
    done

    # Force kill if still running
    echo "Force killing MQ Monitor..."
    kill -KILL $PID
    sleep 1

    if ! ps -p $PID > /dev/null 2>&1; then
        echo "MQ Monitor force stopped"
        rm "$PID_FILE"
        exit 0
    else
        echo "Failed to stop MQ Monitor"
        exit 1
    fi
else
    echo "MQ Monitor is not running (Process not found)"
    rm "$PID_FILE"
    exit 0
fi