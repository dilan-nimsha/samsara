#!/bin/bash

# Samsara RMS - Development Startup Script for Unix/Linux/Mac

echo ""
echo "==============================================="
echo " Samsara RMS - Development Environment Setup"
echo "==============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error installing dependencies"
        exit 1
    fi
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "WARNING: .env.local not found!"
    echo "Please create .env.local with your configuration."
    echo "Use .env.example as a template."
    echo ""
fi

# Display menu
echo ""
echo "Choose how to start the development environment:"
echo ""
echo "1 - Run Website Only (npm run dev)"
echo "2 - Run Website + Backend (npm run dev:all)"
echo "3 - Build Project"
echo "4 - Exit"
echo ""

read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "Starting website only on http://localhost:3000..."
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo "Starting website and backend..."
        echo "Website: http://localhost:3000"
        echo ""
        npm run dev:all
        ;;
    3)
        echo ""
        echo "Building project..."
        echo ""
        npm run build:all
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
