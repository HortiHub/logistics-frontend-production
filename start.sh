#!/bin/bash

# start.sh - Railway deployment script for React frontend

echo "🚀 Starting logistics frontend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building React application..."
npm run build

# Install serve globally
echo "📡 Installing serve..."
npm install -g serve

# Start the application
echo "🎉 Starting frontend server..."
exec serve -s build -l $PORT
