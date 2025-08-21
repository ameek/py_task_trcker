# Task Tracker Application

A modern, full-featured task tracking application built with Node.js/Express (backend), Vanilla JavaScript (frontend), and MongoDB (database). Features real-time task management, time tracking, reporting, and a beautiful responsive design. Built with AI assistance using Claude Sonnet.

> **Note**: This application was built with AI assistance and implements the complete SRS (Software Requirements Specification) with modern web technologies.

## Features

- 🔐 **User Authentication**: Simple header-based authentication system
- 📋 **Task Management**: Complete CRUD operations - create, edit, delete, and organize tasks
- ⏱️ **Real-time Task Control**: Start, pause, finish tasks with automatic state management
- 🎯 **Focus Management**: Single active task enforcement - starting a task auto-pauses others
- 📊 **Time Tracking**: Comprehensive time tracking with session management
- 📈 **Reports & Analytics**: Daily, weekly reports with productivity statistics
- 🏷️ **Task Organization**: Categories, tags, priority levels, and notes
- 🔗 **Resource Links**: Attach multiple links and resources to tasks
- 📱 **Responsive Design**: Beautiful, mobile-friendly interface
- 🐳 **Docker Support**: Complete containerized deployment with Docker Compose
- 📥 **Data Export**: Export reports in various formats

## Tech Stack

### Backend
- **Node.js & Express**: Fast, lightweight web framework
- **MongoDB**: NoSQL database with native MongoDB driver
- **Modular Architecture**: Clean separation with models, services, controllers
- **RESTful API**: Well-structured API endpoints with proper HTTP methods
- **Docker**: Containerized deployment

### Frontend
- **Vanilla JavaScript**: Pure JavaScript with modern ES6+ features
- **Modular Components**: Component-based architecture (TaskComponent, AuthComponent, etc.)
- **CSS3**: Modern styling with responsive design
- **Font Awesome**: Beautiful icons and UI elements
- **Real-time Updates**: Dynamic UI updates and timer displays

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd task-tracker
   ```

2. **Run the setup script**
   
   **On Windows:**
   ```bash
   start.bat
   ```
   
   **On Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   
   **Or manually:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:8000
   - MongoDB: localhost:27017

4. **Start using the application**
   - Navigate to http://localhost:3002
   - Login with any username (simple authentication)
   - Start creating and managing your tasks!

## API Endpoints

### Authentication
- `POST /auth/login` - Login user (simple header-based auth)

### Tasks
- `GET /tasks` - Get all user tasks
- `POST /tasks` - Create a new task
- `GET /tasks/{task_id}` - Get a specific task
- `PUT /tasks/{task_id}` - Update a task
- `DELETE /tasks/{task_id}` - Delete a task
- `POST /tasks/{task_id}/start` - Start working on a task
- `POST /tasks/{task_id}/pause` - Pause a task
- `POST /tasks/{task_id}/finish` - Complete a task

### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create a category
- `PUT /categories/{category_id}` - Update a category
- `DELETE /categories/{category_id}` - Delete a category

### Reports
- `GET /reports/daily` - Get daily productivity report
- `GET /reports/weekly` - Get weekly productivity report
- `GET /reports/stats` - Get productivity statistics
- `GET /reports/export` - Export data in various formats

### Task Links
- `GET /tasks/{task_id}/links` - Get task links
- `POST /tasks/{task_id}/links` - Add a link to task
- `DELETE /tasks/{task_id}/links/{link_id}` - Remove a task link

## Environment Variables

The application uses environment variables for configuration. The Docker Compose setup handles most of this automatically:

```env
# Backend Environment Variables (handled by Docker Compose)
MONGODB_URL=mongodb://admin:password@mongodb:27017/task_tracker?authSource=admin
DATABASE_NAME=task_tracker

# MongoDB Root Credentials (handled by Docker Compose)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=task_tracker

# Frontend connects to backend on port 8000
```

## Local Development

### Backend Development

1. **Navigate to backend directory**
   ```bash
   cd backend-nodejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB (if not using Docker)**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGODB_URL in your environment
   ```

4. **Run the development server**
   ```bash
   npm start
   # or
   node server-refactored.js
   ```

### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend-vanilla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   # or
   node server.js
   ```

## Project Structure

```
task-tracker/
├── backend-nodejs/          # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic services
│   ├── server-refactored.js # Main server file
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile         # Backend Docker configuration
├── frontend-vanilla/        # Vanilla JavaScript frontend
│   ├── public/
│   │   ├── js/
│   │   │   ├── components/ # JavaScript components
│   │   │   ├── services/   # API services
│   │   │   └── utils/      # Utility functions
│   │   ├── index.html      # Main HTML file
│   │   ├── app.js         # Main application file
│   │   └── styles.css     # CSS styles
│   ├── server.js          # Frontend server (serves static files)
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Frontend Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── start.sh              # Linux/Mac startup script
├── start.bat             # Windows startup script
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## Features in Detail

### Task Management
- **Complete CRUD Operations**: Create, read, update, delete tasks
- **Task States**: Pending, In Progress, Paused, Completed
- **Rich Task Properties**: Title, description, priority, category, tags, notes
- **Task Overview Modal**: Detailed view with all task information

### Focus Management (Core Feature)
- **Single Active Task**: Only one task can be in progress at a time
- **Auto-Pause**: Starting a new task automatically pauses the current one
- **Visual Indicators**: Clear status indicators for active tasks
- **Confirmation Dialogs**: User confirmation when switching between tasks

### Time Tracking
- **Session Tracking**: Individual work sessions with start/pause cycles  
- **Total Time**: Cumulative time spent on each task
- **Real-time Timer**: Live timer display for active tasks
- **Time History**: Track all time sessions for detailed analysis

### Reports & Analytics
- **Daily Reports**: Daily productivity summaries
- **Weekly Reports**: Weekly productivity analysis
- **Statistics**: Task completion stats and trends
- **Data Export**: Export reports in multiple formats

### User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Clean, intuitive interface with Font Awesome icons
- **Real-time Updates**: Dynamic updates without page refresh
- **Modular Components**: Well-organized JavaScript component architecture

## Deployment

### Production Deployment

1. **Update environment variables for production**
   - Change MongoDB credentials in docker-compose.yml
   - Update any hardcoded URLs if deploying to different domains

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Or deploy to cloud platforms**
   - Backend: Deploy to AWS ECS, Google Cloud Run, or Heroku
   - Frontend: Deploy to Netlify, Vercel, or AWS S3 (after building static files)
   - Database: Use MongoDB Atlas or managed MongoDB services

### Security Considerations

- Change default MongoDB credentials in production
- Implement proper authentication system for production use
- Enable HTTPS in production
- Set up proper CORS origins
- Add rate limiting and input validation
- Regular security updates for dependencies

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Stop existing containers
   docker-compose down
   
   # Or change ports in docker-compose.yml
   ```

2. **MongoDB connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB container
   docker-compose restart mongodb
   ```

3. **Frontend build issues**
   ```bash
   # Clear node_modules and reinstall
   cd frontend-vanilla
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Backend dependency issues**
   ```bash
   # Rebuild backend container
   docker-compose build --no-cache backend
   ```

5. **Database connection issues**
   ```bash
   # Check if MongoDB is properly initialized
   docker-compose logs mongodb
   
   # Restart the entire stack
   docker-compose down && docker-compose up
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Create an issue on GitHub with detailed error logs
3. Review the API endpoints and ensure proper request format

---

**Happy task tracking! 📝✨**

## Database Schema

### Users
- _id: ObjectId
- username: string (used for simple auth)
- created_at: datetime

### Tasks  
- _id: ObjectId
- user_id: string
- title: string
- description: string (optional)
- status: enum (pending, in_progress, paused, completed)
- priority: enum (low, medium, high)
- category: ObjectId (reference to categories)
- tags: array of strings
- notes: string (optional)
- total_time: number (in milliseconds)
- created_at: datetime
- updated_at: datetime

### Categories
- _id: ObjectId
- user_id: string
- name: string
- color: string (hex color code)
- created_at: datetime

### Time Sessions
- _id: ObjectId
- task_id: ObjectId
- user_id: string
- start_time: datetime
- end_time: datetime (optional for active sessions)
- duration: number (in milliseconds)
- created_at: datetime

### Task Links
- _id: ObjectId
- task_id: ObjectId
- url: string
- title: string (optional)
- created_at: datetime

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please create an issue in the repository.
