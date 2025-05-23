#!/bin/bash

# Simple script to start a local web server for testing

echo "Starting local web server for WineRater..."
echo "----------------------------------------"
echo ""
echo "The app will be available at:"
echo "  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer 8000
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server -p 8000
else
    echo "Error: No suitable web server found."
    echo "Please install Python or Node.js"
    exit 1
fi