#!/bin/bash

# Health check script for Docker container

# Check if Nginx is running
if ! pgrep nginx > /dev/null; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Check if Backend is responding
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend health check failed"
    exit 1
fi

# Check if Nginx is serving frontend
if ! curl -f http://localhost:80/ > /dev/null 2>&1; then
    echo "❌ Nginx health check failed"
    exit 1
fi

echo "✅ All health checks passed"
exit 0
