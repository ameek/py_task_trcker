@echo off
REM Task Tracker - Development Setup Script for Windows

echo 🚀 Setting up Task Tracker Application...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

echo ✅ Docker is running

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📄 Creating environment file...
    copy .env.example .env
    echo ✅ Environment file created from template
    echo ⚠️  Please review and update the .env file with your desired settings
) else (
    echo ✅ Environment file already exists
)

echo 🏗️  Building and starting services...

REM Build and start services
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...

REM Wait for backend to be ready
echo Waiting for Backend API...
:wait_backend
timeout /t 3 /nobreak >nul
curl -f http://localhost:8000/ >nul 2>&1
if %errorlevel% neq 0 goto wait_backend
echo ✅ Backend API is ready

REM Wait for frontend to be ready
echo Waiting for Frontend...
:wait_frontend
timeout /t 3 /nobreak >nul
curl -f http://localhost:3000/ >nul 2>&1
if %errorlevel% neq 0 goto wait_frontend
echo ✅ Frontend is ready

echo.
echo 🎉 Task Tracker Application is now running!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📊 MongoDB: localhost:27017
echo.
echo 📖 API Documentation: http://localhost:8000/docs
echo.
echo To stop the application: docker-compose down
echo To view logs: docker-compose logs -f
echo.
echo Happy task tracking! 📝✨

pause
