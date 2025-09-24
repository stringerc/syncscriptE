# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build the server TypeScript
RUN cd server && npm run build

# Build the client
RUN cd client && npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "start"]
