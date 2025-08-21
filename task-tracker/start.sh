#!/bin/bash

# Task Tracker - Development Setup Script

echo "🚀 Setting up Task Tracker Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created from template"
    echo "⚠️  Please review and update the .env file with your desired settings"
else
    echo "✅ Environment file already exists"
fi

echo "🏗️  Building and starting services..."

# Build and start services
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until docker-compose exec -T mongodb mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    sleep 2
done
echo "✅ MongoDB is ready"

# Wait for backend to be ready
echo "Waiting for Backend API..."
until curl -f http://localhost:8000/ > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Backend API is ready"

# Wait for frontend to be ready
echo "Waiting for Frontend..."
until curl -f http://localhost:3000/ > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Frontend is ready"

echo ""
echo "🎉 Task Tracker Application is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 MongoDB: localhost:27017"
echo ""
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""
echo "To stop the application: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
echo "Happy task tracking! 📝✨"
