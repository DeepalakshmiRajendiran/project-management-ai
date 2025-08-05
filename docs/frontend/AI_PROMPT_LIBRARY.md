# AI Prompt Library
## Project Management System Development

---

## 🎯 **Overview**

This AI Prompt Library contains carefully crafted prompts for various aspects of project management system development. These prompts are designed to work with AI assistants like ChatGPT, Claude, or GitHub Copilot to accelerate development and ensure high-quality code.

### **Prompt Categories**
- **Architecture & Design**
- **Frontend Development**
- **Backend Development**
- **Database & API**
- **Testing & Quality**
- **Deployment & DevOps**
- **Documentation**
- **Troubleshooting**

---

## 🏗️ **Architecture & Design Prompts**

### **System Architecture Design**
```
Create a comprehensive system architecture for a project management application with the following requirements:

- React frontend with TypeScript
- Node.js/Express backend
- PostgreSQL database
- JWT authentication
- Real-time notifications
- File upload capabilities
- Role-based access control
- Time tracking features

Include:
- Component hierarchy diagram
- Database schema design
- API endpoint structure
- Security considerations
- Scalability patterns
- Performance optimization strategies

Please provide detailed explanations for each architectural decision.
```

### **Component Architecture**
```
Design a React component architecture for a project management dashboard with the following features:

- Project cards with progress indicators
- Task lists with drag-and-drop functionality
- Team member management interface
- Time tracking widgets
- Real-time notifications
- Search and filtering capabilities

Requirements:
- Use functional components with hooks
- Implement proper state management
- Ensure responsive design
- Follow accessibility guidelines
- Optimize for performance
- Include error boundaries

Please provide:
- Component hierarchy diagram
- State management strategy
- Props and interfaces
- Component responsibilities
- Reusability considerations
```

### **Database Schema Design**
```
Design a comprehensive PostgreSQL database schema for a project management system with the following entities:

Core Entities:
- Users (authentication, profiles, roles)
- Projects (details, status, timeline)
- Tasks (assignments, status, priorities)
- Teams (members, roles, permissions)
- Time Logs (tracking, billing, reporting)
- Comments (discussions, attachments)
- Files (uploads, versions, sharing)

Requirements:
- Proper relationships and constraints
- Indexing strategy for performance
- Data integrity rules
- Audit trail capabilities
- Soft delete implementation
- Scalability considerations

Please provide:
- Complete CREATE TABLE statements
- Foreign key relationships
- Indexes for optimization
- Check constraints
- Triggers for audit trails
- Sample data for testing
```

---

## 🎨 **Frontend Development Prompts**

### **React Component Development**
```
Create a React component for a project card with the following specifications:

Features:
- Project name and description
- Progress bar with percentage
- Team member avatars
- Due date with status indicator
- Quick action buttons (edit, delete, view)
- Hover effects and animations

Technical Requirements:
- TypeScript with proper interfaces
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard navigation)
- Loading states and error handling
- Optimistic updates

Props Interface:
- project: Project object with all details
- onEdit: Function to handle edit action
- onDelete: Function to handle delete action
- onView: Function to handle view action
- isLoading: Boolean for loading state

Please include:
- Complete component code
- TypeScript interfaces
- CSS classes and styling
- Event handlers
- Error boundaries
- Unit test examples
```

### **State Management with Context**
```
Create a React Context for managing project state with the following requirements:

State Structure:
- projects: Array of project objects
- currentProject: Currently selected project
- loading: Loading states
- error: Error states
- filters: Search and filter criteria

Actions:
- fetchProjects: Load projects from API
- createProject: Add new project
- updateProject: Modify existing project
- deleteProject: Remove project
- setCurrentProject: Select project
- setFilters: Update filter criteria

Requirements:
- Use useReducer for complex state
- Implement proper error handling
- Include loading states
- Optimistic updates
- Cache management
- TypeScript support

Please provide:
- Context provider component
- Reducer function
- Custom hooks for state access
- Action creators
- Error handling utilities
- Performance optimizations
```

### **Form Development**
```
Create a comprehensive form component for creating/editing projects with the following fields:

Form Fields:
- Project Name (required, validation)
- Description (textarea, optional)
- Start Date (date picker)
- End Date (date picker, after start date)
- Priority (select: Low, Medium, High, Urgent)
- Status (select: Active, On Hold, Completed, Cancelled)
- Team Members (multi-select with search)
- Tags (input with chips/tags)

Requirements:
- Form validation with error messages
- Real-time validation
- File upload for project attachments
- Auto-save functionality
- Responsive design
- Accessibility compliance

Technical Stack:
- React Hook Form for form management
- Yup for validation schemas
- Tailwind CSS for styling
- React Select for dropdowns
- Date picker component
- File upload with preview

Please provide:
- Complete form component
- Validation schemas
- Error handling
- Loading states
- Success feedback
- Accessibility features
```

### **Data Visualization**
```
Create a dashboard with data visualization components for project analytics:

Charts Required:
- Project progress overview (pie chart)
- Task completion trends (line chart)
- Team member workload (bar chart)
- Time tracking summary (donut chart)
- Project timeline (Gantt chart style)

Data Sources:
- Project statistics API
- Time tracking data
- Team performance metrics
- Task completion rates

Requirements:
- Use Chart.js or Recharts library
- Responsive design
- Interactive tooltips
- Color-coded status indicators
- Real-time data updates
- Export functionality

Please provide:
- Chart components
- Data transformation utilities
- Color schemes and themes
- Responsive breakpoints
- Loading and error states
- Export functions
```

---

## ⚙️ **Backend Development Prompts**

### **Express.js API Development**
```
Create a comprehensive Express.js API for project management with the following endpoints:

Authentication Endpoints:
- POST /auth/register - User registration
- POST /auth/login - User login
- GET /auth/me - Get current user
- POST /auth/logout - User logout
- POST /auth/refresh - Refresh token

Project Endpoints:
- GET /api/projects - List projects
- POST /api/projects - Create project
- GET /api/projects/:id - Get project details
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

Task Endpoints:
- GET /api/tasks - List tasks
- POST /api/tasks - Create task
- GET /api/tasks/:id - Get task details
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task

Requirements:
- JWT authentication middleware
- Input validation with express-validator
- Error handling middleware
- Rate limiting
- CORS configuration
- Request logging
- Database integration with PostgreSQL

Please provide:
- Complete Express.js application structure
- Middleware implementations
- Route handlers
- Error handling
- Validation schemas
- Database queries
- Security measures
```

### **Database Operations**
```
Create database service functions for project management operations:

Required Functions:
- createProject(projectData, userId)
- getProjects(filters, userId)
- getProjectById(projectId, userId)
- updateProject(projectId, updates, userId)
- deleteProject(projectId, userId)
- addProjectMember(projectId, memberData)
- removeProjectMember(projectId, memberId)
- getProjectStats(projectId)

Requirements:
- Use parameterized queries for security
- Implement proper error handling
- Include transaction support
- Optimize queries with proper joins
- Handle soft deletes
- Include audit logging
- Support pagination and filtering

Database Schema:
- projects (id, name, description, status, created_by, created_at)
- project_members (id, project_id, user_id, role, joined_at)
- tasks (id, title, description, project_id, assigned_to, status)
- time_logs (id, task_id, user_id, hours_spent, logged_at)

Please provide:
- Complete service functions
- SQL queries with proper joins
- Error handling
- Transaction management
- Query optimization
- Security measures
```

### **Authentication & Authorization**
```
Implement JWT-based authentication and role-based authorization system:

Authentication Features:
- User registration with password hashing
- Login with JWT token generation
- Token refresh mechanism
- Password reset functionality
- Account verification

Authorization Features:
- Role-based access control (Admin, Manager, Developer, Viewer)
- Project-level permissions
- Task-level permissions
- API endpoint protection
- Resource ownership validation

Requirements:
- Use bcrypt for password hashing
- JWT token with expiration
- Refresh token rotation
- Rate limiting for auth endpoints
- Account lockout after failed attempts
- Audit logging for security events

Please provide:
- Authentication middleware
- Authorization middleware
- User service functions
- Token management utilities
- Security configurations
- Error handling
- Audit logging
```

---

## 🗄️ **Database & API Prompts**

### **Database Migration Scripts**
```
Create database migration scripts for a project management system:

Migration Requirements:
- Initial schema creation
- User management tables
- Project and task tables
- Team member relationships
- Time tracking tables
- Audit and logging tables
- Indexes for performance
- Constraints for data integrity

Database: PostgreSQL
Tools: Sequelize or raw SQL

Please provide:
- Migration files with up/down functions
- Proper foreign key relationships
- Indexes for query optimization
- Check constraints for data validation
- Triggers for audit trails
- Sample data seeding
- Rollback procedures
```

### **API Documentation Generation**
```
Generate comprehensive API documentation for the project management system:

Documentation Requirements:
- OpenAPI 3.0 specification
- All endpoint descriptions
- Request/response examples
- Authentication methods
- Error codes and messages
- Rate limiting information
- Testing examples

Endpoints to Document:
- Authentication (register, login, logout)
- Projects (CRUD operations)
- Tasks (CRUD operations)
- Team management
- Time tracking
- File uploads
- Reports and analytics

Please provide:
- Complete OpenAPI specification
- Interactive documentation setup
- Code examples in multiple languages
- Postman collection
- Testing scenarios
- Error handling documentation
```

### **Database Query Optimization**
```
Optimize database queries for a project management system with the following requirements:

Query Optimization Goals:
- Reduce query execution time
- Minimize database load
- Improve user experience
- Support large datasets
- Handle concurrent users

Queries to Optimize:
- Project listing with team members and stats
- Task filtering with multiple criteria
- Time tracking aggregation
- User activity reports
- Search functionality across multiple tables

Database: PostgreSQL
Current Performance Issues:
- N+1 query problems
- Missing indexes
- Inefficient joins
- Large result sets

Please provide:
- Optimized SQL queries
- Index recommendations
- Query execution plans
- Performance benchmarks
- Caching strategies
- Database configuration
```

---

## 🧪 **Testing & Quality Prompts**

### **Unit Testing Setup**
```
Set up comprehensive unit testing for a project management system:

Testing Requirements:
- Frontend component testing (React Testing Library)
- Backend API testing (Jest + Supertest)
- Database testing (test database setup)
- Authentication testing
- Error handling testing
- Performance testing

Test Coverage Goals:
- 90%+ code coverage
- All critical user paths
- Error scenarios
- Edge cases
- Integration points

Please provide:
- Testing configuration files
- Test utilities and helpers
- Mock data and fixtures
- Test database setup
- CI/CD integration
- Coverage reporting
- Example test cases
```

### **Integration Testing**
```
Create integration tests for the project management API:

Test Scenarios:
- Complete user registration and login flow
- Project creation with team member assignment
- Task creation and assignment workflow
- Time tracking and reporting
- File upload and management
- Role-based access control
- Error handling and validation

Testing Tools:
- Jest for test runner
- Supertest for HTTP assertions
- PostgreSQL test database
- Mock external services

Requirements:
- Test database isolation
- Clean state between tests
- Realistic test data
- Performance assertions
- Security testing
- Error scenario coverage

Please provide:
- Integration test suite
- Test database setup
- Mock implementations
- Test utilities
- Performance benchmarks
- Security test cases
```

### **End-to-End Testing**
```
Create end-to-end tests for the project management application:

Test Scenarios:
- User registration and onboarding
- Project creation and management
- Task assignment and completion
- Team collaboration workflow
- Time tracking and reporting
- File sharing and management
- Admin user management

Testing Tools:
- Cypress or Playwright
- Visual regression testing
- Performance testing
- Accessibility testing

Requirements:
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
- Performance benchmarks
- Error handling validation
- User experience testing

Please provide:
- E2E test configuration
- Test scenarios and flows
- Page object models
- Custom commands
- Visual testing setup
- Performance monitoring
```

---

## 🚀 **Deployment & DevOps Prompts**

### **Docker Configuration**
```
Create Docker configuration for the project management system:

Requirements:
- Multi-stage builds for optimization
- Separate containers for frontend and backend
- Database container setup
- Redis for caching
- Nginx for reverse proxy
- SSL certificate handling

Environment Support:
- Development environment
- Staging environment
- Production environment

Please provide:
- Dockerfile for frontend
- Dockerfile for backend
- Docker Compose configuration
- Nginx configuration
- Environment-specific configs
- Health check implementations
- Volume management
```

### **CI/CD Pipeline**
```
Create a comprehensive CI/CD pipeline for the project management system:

Pipeline Stages:
- Code quality checks (linting, formatting)
- Unit and integration tests
- Security scanning
- Build and package
- Deploy to staging
- Deploy to production
- Post-deployment verification

Tools:
- GitHub Actions or GitLab CI
- Docker for containerization
- Kubernetes for orchestration
- AWS or similar cloud platform

Requirements:
- Automated testing
- Security scanning
- Performance testing
- Rollback capabilities
- Monitoring integration
- Slack/email notifications

Please provide:
- CI/CD configuration files
- Deployment scripts
- Environment configurations
- Monitoring setup
- Rollback procedures
- Notification systems
```

### **Kubernetes Deployment**
```
Create Kubernetes manifests for deploying the project management system:

Components:
- Frontend deployment and service
- Backend deployment and service
- PostgreSQL database
- Redis cache
- Nginx ingress controller
- Monitoring stack

Requirements:
- High availability setup
- Auto-scaling configuration
- Health checks and readiness probes
- Resource limits and requests
- Secrets management
- Persistent storage
- Load balancing

Please provide:
- Deployment manifests
- Service configurations
- Ingress rules
- ConfigMaps and Secrets
- Persistent volume claims
- Horizontal pod autoscaler
- Monitoring configurations
```

---

## 📚 **Documentation Prompts**

### **API Documentation**
```
Generate comprehensive API documentation for the project management system:

Documentation Requirements:
- Complete endpoint reference
- Request/response examples
- Authentication methods
- Error handling
- Rate limiting
- Code examples in multiple languages

API Endpoints:
- Authentication endpoints
- Project management endpoints
- Task management endpoints
- Team management endpoints
- Time tracking endpoints
- File management endpoints

Please provide:
- OpenAPI specification
- Interactive documentation setup
- Code examples (JavaScript, Python, cURL)
- Postman collection
- Testing scenarios
- Error code reference
```

### **User Documentation**
```
Create user documentation for the project management system:

Documentation Sections:
- Getting started guide
- User interface overview
- Feature tutorials
- Troubleshooting guide
- FAQ section
- Video tutorials

Target Audience:
- End users (project managers, team members)
- Administrators
- IT support staff

Please provide:
- User guide structure
- Step-by-step tutorials
- Screenshots and diagrams
- Video script outlines
- Troubleshooting flowcharts
- FAQ content
```

### **Developer Documentation**
```
Create developer documentation for the project management system:

Documentation Sections:
- Architecture overview
- Development setup
- API reference
- Database schema
- Deployment guide
- Contributing guidelines

Technical Details:
- Code structure and organization
- Design patterns used
- Testing strategies
- Performance considerations
- Security measures
- Troubleshooting guide

Please provide:
- Architecture diagrams
- Setup instructions
- Code examples
- Best practices
- Troubleshooting procedures
- Contribution guidelines
```

---

## 🔧 **Troubleshooting Prompts**

### **Performance Issues**
```
Debug and optimize performance issues in the project management system:

Performance Problems:
- Slow page load times
- Database query bottlenecks
- Memory leaks
- High CPU usage
- Network latency issues

Investigation Areas:
- Frontend bundle size
- Database query optimization
- Caching strategies
- CDN configuration
- Server resource usage

Please provide:
- Performance analysis tools
- Optimization strategies
- Monitoring setup
- Benchmarking procedures
- Caching implementations
- Resource optimization
```

### **Security Vulnerabilities**
```
Identify and fix security vulnerabilities in the project management system:

Security Areas:
- Authentication and authorization
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- File upload security

Assessment Tools:
- Security scanning tools
- Penetration testing
- Code analysis
- Dependency scanning

Please provide:
- Security audit checklist
- Vulnerability assessment
- Fix implementations
- Security testing procedures
- Monitoring and alerting
- Incident response plan
```

### **Database Issues**
```
Troubleshoot database issues in the project management system:

Common Issues:
- Connection pool exhaustion
- Slow query performance
- Data corruption
- Migration failures
- Backup and recovery problems

Investigation Steps:
- Query performance analysis
- Database monitoring
- Log analysis
- Resource usage monitoring

Please provide:
- Diagnostic procedures
- Performance optimization
- Monitoring setup
- Backup strategies
- Recovery procedures
- Maintenance schedules
```

---

## 🎯 **Specialized Prompts**

### **Real-time Features**
```
Implement real-time features for the project management system:

Real-time Requirements:
- Live project updates
- Task status changes
- Team member activity
- Instant notifications
- Collaborative editing
- Live chat functionality

Technology Stack:
- WebSocket or Socket.io
- Redis for pub/sub
- Real-time database updates
- Client-side state management

Please provide:
- WebSocket server setup
- Client-side integration
- Real-time event handling
- State synchronization
- Performance optimization
- Error handling
```

### **Mobile Responsiveness**
```
Optimize the project management system for mobile devices:

Mobile Requirements:
- Responsive design
- Touch-friendly interface
- Offline functionality
- Push notifications
- Mobile-specific features

Design Considerations:
- Mobile-first approach
- Touch targets and gestures
- Performance optimization
- Battery efficiency
- Network optimization

Please provide:
- Responsive design implementation
- Mobile-specific components
- Touch interaction handling
- Offline functionality
- Performance optimizations
- Testing procedures
```

### **Accessibility Compliance**
```
Implement accessibility features for the project management system:

Accessibility Requirements:
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Color contrast compliance
- Focus management
- Alternative text for images

Implementation Areas:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard event handling
- Color and contrast
- Focus indicators
- Error messaging

Please provide:
- Accessibility audit checklist
- Implementation guidelines
- Testing procedures
- Compliance verification
- User testing protocols
- Documentation requirements
```

---

## 📋 **Prompt Usage Guidelines**

### **Best Practices**
1. **Be Specific**: Include detailed requirements and constraints
2. **Provide Context**: Explain the problem and desired outcome
3. **Include Examples**: Show expected input/output formats
4. **Specify Technology**: Mention specific tools and frameworks
5. **Request Validation**: Ask for testing and verification steps

### **Prompt Structure**
```
[Context/Background]
[Specific Requirements]
[Technical Constraints]
[Expected Output]
[Additional Considerations]
```

### **Quality Assurance**
- Review generated code for security
- Test all implementations thoroughly
- Validate against requirements
- Check for best practices
- Ensure documentation completeness

---

This AI Prompt Library provides a comprehensive collection of prompts to accelerate development and ensure high-quality implementation of the project management system. 