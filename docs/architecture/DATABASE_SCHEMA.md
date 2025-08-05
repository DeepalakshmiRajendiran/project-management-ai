# Database Schema Design

## 🗄️ Database Overview

The project management system uses PostgreSQL with a relational schema designed for scalability and data integrity.

## 📊 Core Tables

### **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Projects Table**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Project Members Table**
```sql
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'developer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    CHECK (role IN ('project_manager', 'developer', 'viewer'))
);
```

### **Tasks Table**
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Time Logs Table**
```sql
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    hours_spent DECIMAL(5,2) NOT NULL,
    description TEXT,
    logged_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Milestones Table**
```sql
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Comments Table**
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Invitations Table**
```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'developer',
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('project_manager', 'developer', 'viewer'))
);
```

## 🔗 Relationships

### **One-to-Many Relationships**
- **User → Projects**: One user can create many projects
- **User → Tasks**: One user can create many tasks
- **User → Time Logs**: One user can have many time logs
- **Project → Tasks**: One project can have many tasks
- **Project → Milestones**: One project can have many milestones
- **Task → Comments**: One task can have many comments
- **Task → Time Logs**: One task can have many time logs

### **Many-to-Many Relationships**
- **Users ↔ Projects**: Through `project_members` table
- **Users ↔ Tasks**: Through assignment and creation

## 📈 Indexes for Performance

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Projects table indexes
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);

-- Tasks table indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Project members indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- Time logs indexes
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_logged_at ON time_logs(logged_at);

-- Comments indexes
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Invitations indexes
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_project_id ON invitations(project_id);
```

## 🔒 Constraints and Validation

### **Check Constraints**
```sql
-- Project status validation
ALTER TABLE projects ADD CONSTRAINT check_project_status 
CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled'));

-- Project priority validation
ALTER TABLE projects ADD CONSTRAINT check_project_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Task status validation
ALTER TABLE tasks ADD CONSTRAINT check_task_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Task priority validation
ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Time log hours validation
ALTER TABLE time_logs ADD CONSTRAINT check_hours_spent 
CHECK (hours_spent > 0 AND hours_spent <= 24);

-- Date validation
ALTER TABLE projects ADD CONSTRAINT check_project_dates 
CHECK (end_date IS NULL OR end_date >= start_date);
```

## 📊 Views for Analytics

### **Project Statistics View**
```sql
CREATE VIEW project_stats AS
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT pm.user_id) as team_size,
    COALESCE(SUM(tl.hours_spent), 0) as total_hours_logged,
    COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN time_logs tl ON t.id = tl.task_id
GROUP BY p.id, p.name, p.status;
```

### **User Activity View**
```sql
CREATE VIEW user_activity AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT p.id) as projects_created,
    COUNT(DISTINCT t.id) as tasks_created,
    COUNT(DISTINCT tl.id) as time_logs_created,
    COALESCE(SUM(tl.hours_spent), 0) as total_hours_logged
FROM users u
LEFT JOIN projects p ON u.id = p.created_by
LEFT JOIN tasks t ON u.id = t.created_by
LEFT JOIN time_logs tl ON u.id = tl.user_id
GROUP BY u.id, u.username, u.email;
```

## 🔄 Triggers for Data Integrity

### **Updated At Trigger**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📋 Sample Data Queries

### **Get Project with Team and Tasks**
```sql
SELECT 
    p.name as project_name,
    p.status as project_status,
    u.username as creator,
    COUNT(DISTINCT pm.user_id) as team_size,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
FROM projects p
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.id = $1
GROUP BY p.id, p.name, p.status, u.username;
```

### **Get User's Assigned Tasks**
```sql
SELECT 
    t.title,
    t.status,
    t.priority,
    t.due_date,
    p.name as project_name,
    COALESCE(SUM(tl.hours_spent), 0) as hours_logged
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN time_logs tl ON t.id = tl.task_id
WHERE t.assigned_to = $1
GROUP BY t.id, t.title, t.status, t.priority, t.due_date, p.name
ORDER BY t.due_date ASC;
```

This database schema provides a solid foundation for the project management system with proper relationships, constraints, and performance optimizations. 