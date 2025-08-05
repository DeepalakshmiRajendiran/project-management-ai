# API Documentation
## Project Management System

### **Base URL**: `http://localhost:3000/api`
### **Authentication**: JWT Bearer Token
### **Content-Type**: `application/json`

---

## 🔐 **Authentication Endpoints**

### **POST /auth/register**
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email already exists",
    "Username must be at least 3 characters"
  ]
}
```

---

### **POST /auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### **GET /auth/me**
Get current user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📊 **Project Endpoints**

### **GET /projects**
Get all projects for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `completed`, `on_hold`, `cancelled`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `search` (optional): Search in project name and description
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "E-commerce Platform",
        "description": "Build a modern e-commerce platform",
        "status": "active",
        "priority": "high",
        "start_date": "2024-01-01",
        "end_date": "2024-06-30",
        "created_by": "550e8400-e29b-41d4-a716-446655440000",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "team_members": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "username": "jane_smith",
            "email": "jane@example.com",
            "role": "developer"
          }
        ],
        "stats": {
          "total_tasks": 15,
          "completed_tasks": 8,
          "team_size": 3,
          "progress": 53.33
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### **POST /projects**
Create a new project.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Mobile App Development",
  "description": "Develop a cross-platform mobile application",
  "status": "active",
  "priority": "high",
  "start_date": "2024-02-01",
  "end_date": "2024-08-31"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Mobile App Development",
    "description": "Develop a cross-platform mobile application",
    "status": "active",
    "priority": "high",
    "start_date": "2024-02-01",
    "end_date": "2024-08-31",
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

---

### **GET /projects/:id**
Get project details by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "E-commerce Platform",
    "description": "Build a modern e-commerce platform",
    "status": "active",
    "priority": "high",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "team_members": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "jane_smith",
        "email": "jane@example.com",
        "role": "developer",
        "joined_at": "2024-01-15T10:35:00Z"
      }
    ],
    "tasks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "title": "Design Database Schema",
        "status": "completed",
        "priority": "high",
        "assigned_to": "550e8400-e29b-41d4-a716-446655440002"
      }
    ],
    "milestones": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "MVP Release",
        "status": "pending",
        "due_date": "2024-03-15"
      }
    ],
    "stats": {
      "total_tasks": 15,
      "completed_tasks": 8,
      "team_size": 3,
      "total_hours_logged": 120.5,
      "progress": 53.33
    }
  }
}
```

---

### **PUT /projects/:id**
Update project details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated E-commerce Platform",
  "description": "Updated description",
  "status": "on_hold",
  "priority": "medium"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated E-commerce Platform",
    "description": "Updated description",
    "status": "on_hold",
    "priority": "medium",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### **DELETE /projects/:id**
Delete a project.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## 📋 **Task Endpoints**

### **GET /tasks**
Get all tasks for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `project_id` (optional): Filter by project ID
- `status` (optional): Filter by status (`pending`, `in_progress`, `completed`, `cancelled`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `assigned_to` (optional): Filter by assigned user ID
- `search` (optional): Search in task title and description

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Design Database Schema",
      "description": "Create the database schema for the e-commerce platform",
      "status": "completed",
      "priority": "high",
      "project_id": "550e8400-e29b-41d4-a716-446655440001",
      "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "due_date": "2024-01-20",
      "estimated_hours": 8.0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "project": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "E-commerce Platform"
      },
      "assigned_user": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "jane_smith"
      },
      "time_logs": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440006",
          "hours_spent": 6.5,
          "description": "Database design and implementation",
          "logged_at": "2024-01-16"
        }
      ],
      "progress": 81.25
    }
  ]
}
```

---

### **POST /tasks**
Create a new task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Implement User Authentication",
  "description": "Create user registration and login functionality",
  "status": "pending",
  "priority": "high",
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
  "due_date": "2024-01-25",
  "estimated_hours": 12.0
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "title": "Implement User Authentication",
    "description": "Create user registration and login functionality",
    "status": "pending",
    "priority": "high",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
    "due_date": "2024-01-25",
    "estimated_hours": 12.0,
    "created_at": "2024-01-15T11:30:00Z"
  }
}
```

---

### **GET /tasks/:id**
Get task details by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Design Database Schema",
    "description": "Create the database schema for the e-commerce platform",
    "status": "completed",
    "priority": "high",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "due_date": "2024-01-20",
    "estimated_hours": 8.0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "E-commerce Platform"
    },
    "assigned_user": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "jane_smith",
      "email": "jane@example.com"
    },
    "time_logs": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440006",
        "hours_spent": 6.5,
        "description": "Database design and implementation",
        "logged_at": "2024-01-16",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "username": "jane_smith"
        }
      }
    ],
    "comments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "content": "Database schema looks good!",
        "created_at": "2024-01-16T14:30:00Z",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "username": "john_doe"
        }
      }
    ],
    "progress": 81.25
  }
}
```

---

### **PUT /tasks/:id**
Update task details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "status": "in_progress",
  "priority": "medium"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Updated Task Title",
    "status": "in_progress",
    "priority": "medium",
    "updated_at": "2024-01-15T13:00:00Z"
  }
}
```

---

### **DELETE /tasks/:id**
Delete a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 👥 **Team Management Endpoints**

### **GET /team/users**
Get all users in the system.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true
    }
  ]
}
```

---

### **GET /team/project/:projectId**
Get team members for a specific project.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "jane_smith",
      "email": "jane@example.com",
      "role": "developer",
      "joined_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

### **POST /team/project/:projectId**
Add a user to a project team.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440002",
  "role": "developer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User added to project successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "role": "developer",
    "joined_at": "2024-01-15T14:00:00Z"
  }
}
```

---

### **PUT /team/project/:projectId/member/:userId**
Update team member role.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "role": "project_manager"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member role updated successfully"
}
```

---

### **DELETE /team/project/:projectId/member/:userId**
Remove user from project team.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User removed from project successfully"
}
```

---

## ⏰ **Time Tracking Endpoints**

### **GET /time-logs**
Get time logs for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `task_id` (optional): Filter by task ID
- `project_id` (optional): Filter by project ID
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "task_id": "550e8400-e29b-41d4-a716-446655440004",
      "hours_spent": 6.5,
      "description": "Database design and implementation",
      "logged_at": "2024-01-16",
      "created_at": "2024-01-16T10:00:00Z",
      "task": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "title": "Design Database Schema"
      },
      "project": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "E-commerce Platform"
      }
    }
  ]
}
```

---

### **POST /time-logs**
Create a new time log entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440004",
  "hours_spent": 4.0,
  "description": "Implemented user authentication module",
  "logged_at": "2024-01-17"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Time log created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "task_id": "550e8400-e29b-41d4-a716-446655440004",
    "hours_spent": 4.0,
    "description": "Implemented user authentication module",
    "logged_at": "2024-01-17",
    "created_at": "2024-01-17T09:00:00Z"
  }
}
```

---

### **GET /time-logs/summary**
Get time tracking summary.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `timeRange` (optional): Time range filter (`today`, `week`, `month`, `year`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_hours": 120.5,
    "total_tasks": 15,
    "total_projects": 3,
    "daily_average": 8.03,
    "weekly_total": 40.0,
    "monthly_total": 120.5,
    "by_project": [
      {
        "project_id": "550e8400-e29b-41d4-a716-446655440001",
        "project_name": "E-commerce Platform",
        "total_hours": 80.5
      }
    ],
    "by_task": [
      {
        "task_id": "550e8400-e29b-41d4-a716-446655440004",
        "task_title": "Design Database Schema",
        "total_hours": 10.5
      }
    ]
  }
}
```

---

## 📊 **Reports Endpoints**

### **GET /reports/project/:projectId**
Get detailed project report.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "E-commerce Platform",
      "status": "active"
    },
    "stats": {
      "total_tasks": 15,
      "completed_tasks": 8,
      "pending_tasks": 5,
      "in_progress_tasks": 2,
      "total_hours_logged": 120.5,
      "total_estimated_hours": 200.0,
      "progress_percentage": 53.33,
      "team_size": 3
    },
    "task_status_distribution": {
      "completed": 8,
      "in_progress": 2,
      "pending": 5
    },
    "team_performance": [
      {
        "user_id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "jane_smith",
        "tasks_completed": 5,
        "hours_logged": 60.5
      }
    ],
    "recent_activity": [
      {
        "type": "task_completed",
        "description": "Task 'Design Database Schema' marked as completed",
        "timestamp": "2024-01-16T15:30:00Z"
      }
    ]
  }
}
```

---

## 💬 **Comments Endpoints**

### **GET /comments/task/:taskId**
Get comments for a specific task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "content": "Database schema looks good!",
      "task_id": "550e8400-e29b-41d4-a716-446655440004",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-16T14:30:00Z",
      "updated_at": "2024-01-16T14:30:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "john_doe"
      }
    }
  ]
}
```

---

### **POST /comments**
Create a new comment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "content": "Great progress on this task!",
  "task_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "content": "Great progress on this task!",
    "task_id": "550e8400-e29b-41d4-a716-446655440004",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-17T10:00:00Z"
  }
}
```

---

## 🔗 **Invitation Endpoints**

### **POST /invitations**
Send project invitation.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "developer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440012",
    "email": "newuser@example.com",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "role": "developer",
    "status": "pending",
    "expires_at": "2024-01-22T10:00:00Z"
  }
}
```

---

### **GET /invitations/accept/:token**
Accept project invitation.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "role": "developer"
  }
}
```

---

## ⚠️ **Error Responses**

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Field 'email' is required",
    "Invalid email format"
  ]
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🔧 **Rate Limiting**

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute
- **Headers included in response**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📝 **API Usage Examples**

### **JavaScript/Node.js**
```javascript
const axios = require('axios');

// Login
const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
  email: 'john@example.com',
  password: 'password123'
});

const token = loginResponse.data.data.token;

// Get projects
const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
  headers: { Authorization: `Bearer ${token}` }
});

// Create task
const taskResponse = await axios.post('http://localhost:3000/api/tasks', {
  title: 'New Task',
  project_id: 'project-id',
  assigned_to: 'user-id'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **Python**
```python
import requests

# Login
login_data = {
    'email': 'john@example.com',
    'password': 'password123'
}
login_response = requests.post('http://localhost:3000/api/auth/login', json=login_data)
token = login_response.json()['data']['token']

# Get projects
headers = {'Authorization': f'Bearer {token}'}
projects_response = requests.get('http://localhost:3000/api/projects', headers=headers)
```

### **cURL**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'

# Get projects (with token)
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

This API documentation provides comprehensive coverage of all endpoints with detailed examples and error handling for the project management system. 