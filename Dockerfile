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

# Start the server directly with debugging
CMD ["sh", "-c", "echo '🚀 Starting SyncScript deployment...' && cd server && echo '📦 Generating Prisma client...' && npx prisma generate && echo '🗄️ Setting up database schema...' && npx prisma db push --accept-data-loss --skip-generate && echo '✅ Database ready, starting server...' && echo '🔧 Environment check:' && echo 'PORT='$PORT && echo 'NODE_ENV='$NODE_ENV && echo 'DATABASE_URL='$(echo $DATABASE_URL | cut -c1-20)'...' && node dist/index.js"]
