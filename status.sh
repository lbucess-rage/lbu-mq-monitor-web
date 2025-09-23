#!/bin/bash

# MQ Monitor Status Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/mq-monitor.pid"
LOG_FILE="$SCRIPT_DIR/logs/mq-monitor.log"

echo "========================================="
echo "MQ Monitor Status Check"
echo "========================================="

# Check PID file
if [ ! -f "$PID_FILE" ]; then
    echo "Status: STOPPED"
    echo "PID file not found"
else
    PID=$(cat "$PID_FILE")

    if ps -p $PID > /dev/null 2>&1; then
        echo "Status: RUNNING"
        echo "PID: $PID"

        # Show process info
        echo ""
        echo "Process Info:"
        ps -f -p $PID

        # Show port listening status
        echo ""
        echo "Port Status:"
        netstat -tlnp 2>/dev/null | grep $PID || lsof -i :5002 2>/dev/null

        # Show last 10 lines of log
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "Recent Logs:"
            tail -n 10 "$LOG_FILE"
        fi
    else
        echo "Status: STOPPED"
        echo "Process not found (stale PID file)"
        echo "Run ./start.sh to restart"
    fi
fi

echo ""
echo "========================================="
echo "Commands:"
echo "  Start:   ./start.sh"
echo "  Stop:    ./stop.sh"
echo "  Dev:     ./start-dev.sh"
echo "  Logs:    tail -f $LOG_FILE"
echo "========================================="