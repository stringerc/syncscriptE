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

# Generate Prisma client
RUN cd server && npx prisma generate

# Build the client
RUN cd client && npm run build

# Expose port
EXPOSE 3001

# Make startup script executable
RUN chmod +x server/start.sh

# Start the test server
CMD ["node", "server/test-server.js"]
