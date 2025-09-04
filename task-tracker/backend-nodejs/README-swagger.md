# 📚 Task Tracker API Documentation

This directory contains comprehensive Swagger/OpenAPI documentation for the Task Tracker API.

## 🚀 Quick Start

### 1. Start the Backend API
```bash
cd /path/to/task-tracker/backend-nodejs
npm start
# API will be available at http://localhost:8000
```

### 2. Start the Documentation Server
```bash
node swagger-server.js
# Documentation will be available at http://localhost:3001
```

### 3. View Interactive Documentation
Open your browser and navigate to: **http://localhost:3001**

## 📋 Files Included

- **`swagger.yaml`** - Complete OpenAPI 3.0 specification
- **`api-docs.html`** - Swagger UI HTML page
- **`swagger-server.js`** - Simple server to serve the documentation
- **`test-api.sh`** - Comprehensive API testing script
- **`README-swagger.md`** - This documentation file

## 🔧 API Testing

### Using the Interactive Documentation
1. Open http://localhost:3001 in your browser
2. Browse available endpoints organized by categories:
   - **Health** - System status
   - **Authentication** - User registration and login
   - **Tasks** - Task management and time tracking
   - **Categories** - Category management
   - **Reports** - Analytics and data export

3. Click "Try it out" on any endpoint
4. Fill in the required parameters
5. Click "Execute" to test the API

### Using the Test Script
```bash
./test-api.sh
```

### Manual Testing with curl
```bash
# Health check
curl http://localhost:8000/

# Get user profile (requires authentication)
curl -H "x-user-id: YOUR_USER_ID" http://localhost:8000/auth/profile

# List tasks
curl -H "x-user-id: YOUR_USER_ID" http://localhost:8000/tasks

# Create a task
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "priority": "high",
    "category": "Work"
  }'
```

## 🔐 Authentication

This API uses a simplified header-based authentication for demo purposes:
- Header: `x-user-id`
- Value: Your user ID (obtained from registration/login)

### Register a New User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 📊 API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Tasks
- `GET /tasks` - List tasks (with filtering)
- `POST /tasks` - Create new task
- `GET /tasks/{id}` - Get specific task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `POST /tasks/{id}/start` - Start task (time tracking)
- `POST /tasks/{id}/pause` - Pause task
- `POST /tasks/{id}/finish` - Complete task
- `GET /tasks/active` - Get active task
- `POST /tasks/pause-all` - Pause all active tasks

### Task Links
- `GET /tasks/{taskId}/links` - Get task links
- `POST /tasks/{taskId}/links` - Create task link
- `DELETE /tasks/{taskId}/links/{linkId}` - Delete task link

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `GET /categories/{id}` - Get specific category
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Delete category
- `GET /categories/stats` - Category statistics

### Reports
- `GET /reports/daily` - Daily productivity report
- `GET /reports/weekly` - Weekly productivity report
- `GET /reports/stats` - Completion statistics
- `GET /reports/export/{format}` - Export data (JSON/CSV)

## 💡 Features

### Time Tracking
- Automatic time calculation when starting/pausing/finishing tasks
- Time stored in seconds and formatted for display
- Historical time session tracking

### Filtering and Querying
- Filter tasks by status, category, priority
- Date-based reports
- Category-based statistics

### Data Export
- JSON format for programmatic access
- CSV format for spreadsheet applications
- Comprehensive data including time sessions

### Error Handling
- Consistent error response format
- Appropriate HTTP status codes
- Descriptive error messages

## 🛠️ Development

### Adding New Endpoints
1. Update the `swagger.yaml` file with new endpoint definitions
2. Add corresponding schemas if needed
3. Implement the endpoint in your backend code
4. Test using the interactive documentation

### Customizing Authentication
The current authentication is simplified for demo purposes. For production:
1. Implement JWT token-based authentication
2. Update the `securitySchemes` in swagger.yaml
3. Modify the authentication examples

## 📝 Notes

- This is a demo API with simplified authentication
- Passwords are stored in plain text (not recommended for production)
- The API includes comprehensive error handling and validation
- All endpoints return JSON responses
- Time tracking is accurate to the second

## 🔗 Useful Links

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Task Tracker Frontend](../frontend-vanilla/)
- [Backend Source Code](./src/)

---

**Happy API Testing! 🚀**
