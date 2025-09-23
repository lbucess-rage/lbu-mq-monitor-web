#!/bin/bash

# MQ Monitor Restart Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Restarting MQ Monitor..."

# Stop if running
./stop.sh

# Wait a moment
sleep 2

# Start again
./start.sh