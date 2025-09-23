# Simple Frontend Dockerfile that actually works
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (needed for React build)
RUN npm install

# Copy all source code
COPY . .

# Build the React application
RUN npm run build

# Install serve globally for serving static files
RUN npm install -g serve

# Use dynamic port from Railway
EXPOSE $PORT

# Start command
CMD serve -s build -l $PORT
