# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Production stage - just serve with Node.js
FROM node:18-alpine AS production-stage

WORKDIR /app

# Copy package.json and install production dependencies
COPY package.json ./
RUN npm install --production

# Copy server and public files
COPY server.js ./
COPY public ./public

# Expose port 3000
EXPOSE 3000

CMD ["node", "server.js"]
