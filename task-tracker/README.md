# this build with agent :: Claude sonnet 4

it had the srs and supported doc but it still not finish 

# Task Tracker Application

A modern, beautiful task tracking application built with FastAPI (backend), Vue.js (frontend), and MongoDB (database). The application features a responsive design with Tailwind CSS and can be easily deployed using Docker.

## Features

- 🔐 **User Authentication**: Secure JWT-based authentication with registration and login
- 📋 **Task Management**: Create, edit, delete, and organize tasks with priorities and due dates
- 📊 **Kanban Board**: Visual task organization with drag-and-drop functionality
- 🎨 **Modern UI**: Beautiful, responsive design using Tailwind CSS and Headless UI
- ⏱️ **Time Tracking**: Track time spent on tasks (backend ready, frontend can be extended)
- 🐳 **Docker Support**: Easy deployment with Docker Compose

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MongoDB**: NoSQL database with Motor async driver
- **JWT Authentication**: Secure token-based authentication
- **Pydantic**: Data validation and serialization
- **Docker**: Containerized deployment

### Frontend
- **Vue.js 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Pinia**: State management for Vue.js
- **Vue Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Heroicons**: Beautiful SVG icons

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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MongoDB: localhost:27017

4. **Create your first account**
   - Navigate to http://localhost:3000
   - Click "Create new account"
   - Fill in your details and start tracking tasks!

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Tasks
- `GET /tasks/` - Get all user tasks
- `POST /tasks/` - Create a new task
- `GET /tasks/{task_id}` - Get a specific task
- `PUT /tasks/{task_id}` - Update a task
- `DELETE /tasks/{task_id}` - Delete a task
- `GET /tasks/status/{status}` - Get tasks by status

## Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Backend Environment Variables
MONGODB_URL=mongodb://admin:password@mongodb:27017/task_tracker?authSource=admin
DATABASE_NAME=task_tracker
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MongoDB Root Credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=task_tracker

# Frontend Environment Variables
VITE_API_URL=http://localhost:8000
```

## Local Development

### Backend Development

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start MongoDB (if not using Docker)**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGODB_URL in your environment
   ```

5. **Run the development server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
task-tracker/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend Docker configuration
├── frontend/               # Vue.js frontend
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── stores/        # Pinia stores
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── views/         # Vue pages
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── Dockerfile         # Frontend Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables template
├── start.sh              # Linux/Mac startup script
├── start.bat             # Windows startup script
└── README.md             # This file
```

## Features in Detail

### User Authentication
- Secure JWT-based authentication
- Password hashing with bcrypt
- Automatic token refresh
- Route guards for protected pages

### Task Management
- Create tasks with title, description, priority, and due date
- Update task status (To Do, In Progress, Done)
- Edit and delete tasks
- Filter tasks by status

### User Interface
- Responsive design that works on desktop and mobile
- Kanban board layout for visual task management
- Modern UI with Tailwind CSS
- Dark/light theme ready (easy to implement)

## Deployment

### Production Deployment

1. **Update environment variables**
   - Change `SECRET_KEY` to a secure random key
   - Update `MONGODB_URL` if using external MongoDB
   - Set `VITE_API_URL` to your production API URL

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Or deploy to cloud platforms**
   - Backend: Deploy to AWS ECS, Google Cloud Run, or Heroku
   - Frontend: Deploy to Netlify, Vercel, or AWS S3
   - Database: Use MongoDB Atlas, AWS DocumentDB, or managed MongoDB

### Security Considerations

- Change default MongoDB credentials
- Use strong JWT secret key
- Enable HTTPS in production
- Set up proper CORS origins
- Implement rate limiting
- Add input validation and sanitization

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
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Backend dependency issues**
   ```bash
   # Rebuild backend container
   docker-compose build --no-cache backend
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
1. Check the troubleshooting section
2. Create an issue on GitHub
3. Review the API documentation at http://localhost:8000/docs

---

**Happy task tracking! 📝✨**
- id: ObjectId
- email: string (unique)
- full_name: string
- hashed_password: string
- is_active: boolean
- created_at: datetime

### Tasks
- id: ObjectId
- title: string
- description: string (optional)
- status: enum (todo, in_progress, done)
- priority: enum (low, medium, high)
- due_date: datetime (optional)
- user_id: ObjectId
- created_at: datetime
- updated_at: datetime

### Time Entries
- id: ObjectId
- task_id: ObjectId
- start_time: datetime
- end_time: datetime (optional)
- description: string (optional)
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
