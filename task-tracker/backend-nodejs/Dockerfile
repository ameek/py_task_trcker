# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 8000
EXPOSE 8000

CMD ["node", "server-refactored.js"]
