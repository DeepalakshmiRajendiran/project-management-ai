# Component Architecture
## Project Management System - Frontend

---

## 🏗️ **Architecture Overview**

### **Component Hierarchy**
```
App.jsx
├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── Main Content
├── Pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── ProjectDetails.jsx
│   ├── Tasks.jsx
│   ├── TeamManagement.jsx
│   ├── TimeTracking.jsx
│   └── Reports.jsx
├── Components/
│   ├── Common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   └── Loading.jsx
│   ├── Project/
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectModal.jsx
│   │   └── ProjectFilters.jsx
│   ├── Task/
│   │   ├── TaskCard.jsx
│   │   ├── TaskModal.jsx
│   │   ├── TaskList.jsx
│   │   └── TaskDetailModal.jsx
│   ├── Team/
│   │   ├── AddMemberModal.jsx
│   │   ├── RoleAssignmentModal.jsx
│   │   └── InviteMemberModal.jsx
│   └── Dashboard/
│       ├── DashboardStats.jsx
│       ├── TaskProgress.jsx
│       └── TimeSummary.jsx
└── Contexts/
    ├── AuthContext.jsx
    ├── ProjectContext.jsx
    ├── NotificationContext.jsx
    └── CalendarContext.jsx
```

---

## 📦 **Component Categories**

### **1. Layout Components**

#### **Layout.jsx**
```jsx
// Main layout wrapper with sidebar and header
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

**Responsibilities:**
- Authentication guard
- Sidebar and header integration
- Responsive layout management
- Navigation structure

#### **Sidebar.jsx**
```jsx
const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/time-tracking', icon: Clock, label: 'Time Tracking' },
    { path: '/reports', icon: BarChart3, label: 'Reports' }
  ];
  
  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">Project Manager</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
```

**Responsibilities:**
- Navigation menu
- Active route highlighting
- User context display
- Responsive behavior

#### **Header.jsx**
```jsx
const Header = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Project Management System
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationBell notifications={notifications} />
          <UserProfileModal user={user} onLogout={logout} />
        </div>
      </div>
    </header>
  );
};
```

**Responsibilities:**
- User profile management
- Notification display
- Search functionality
- Quick actions

---

### **2. Page Components**

#### **Dashboard.jsx**
```jsx
const Dashboard = () => {
  const { projects, tasks, timeLogs } = useProjects();
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  
  const stats = useMemo(() => ({
    totalProjects: projects.length,
    activeTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalHours: timeLogs.reduce((sum, log) => sum + log.hours_spent, 0)
  }), [projects, tasks, timeLogs]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <TimeRangeSelector 
          value={selectedTimeRange} 
          onChange={setSelectedTimeRange} 
        />
      </div>
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects projects={projects.slice(0, 5)} />
        <RecentTasks tasks={tasks.slice(0, 5)} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskProgress tasks={tasks} />
        <TimeSummary timeLogs={timeLogs} timeRange={selectedTimeRange} />
      </div>
    </div>
  );
};
```

**Responsibilities:**
- Data aggregation and display
- Real-time updates
- User interaction handling
- Layout management

#### **Projects.jsx**
```jsx
const Projects = () => {
  const { projects, loading, error } = useProjects();
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = filters.status === 'all' || project.status === filters.status;
      const matchesPriority = filters.priority === 'all' || project.priority === filters.priority;
      const matchesSearch = project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           project.description.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [projects, filters]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>
      
      <ProjectFilters filters={filters} onFiltersChange={setFilters} />
      
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
      
      <ProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />
    </div>
  );
};
```

**Responsibilities:**
- Project listing and filtering
- Search functionality
- Modal management
- Navigation handling

---

### **3. Feature Components**

#### **ProjectCard.jsx**
```jsx
const ProjectCard = ({ project, onClick }) => {
  const { updateProject, deleteProject } = useProjects();
  const [showActions, setShowActions] = useState(false);
  
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.active;
  };
  
  const getPriorityIcon = (priority) => {
    const icons = {
      low: TrendingDown,
      medium: Minus,
      high: TrendingUp,
      urgent: AlertTriangle
    };
    return icons[priority] || Minus;
  };
  
  const PriorityIcon = getPriorityIcon(project.priority);
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {project.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {project.description}
          </p>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white shadow-lg rounded-md border py-1 z-10">
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // Edit project
                }}
              >
                Edit
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // Delete project
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <div className="flex items-center text-gray-500">
          <PriorityIcon className="w-4 h-4 mr-1" />
          <span className="text-xs">{project.priority}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{project.team_members?.length || 0} members</span>
        <span>{project.stats?.total_tasks || 0} tasks</span>
      </div>
      
      {project.stats && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{project.stats.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${project.stats.progress || 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

**Responsibilities:**
- Project data display
- Interactive actions
- Status and priority visualization
- Progress indication

#### **TaskCard.jsx**
```jsx
const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { user } = useAuth();
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || colors.medium;
  };
  
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          <span>{task.assigned_user?.username || 'Unassigned'}</span>
        </div>
        
        {task.due_date && (
          <div className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar className="w-4 h-4 mr-1" />
            <span>{format(new Date(task.due_date), 'MMM dd')}</span>
            {isOverdue && <AlertTriangle className="w-4 h-4 ml-1" />}
          </div>
        )}
      </div>
      
      {task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetailModal(true)}
          >
            View Details
          </Button>
          
          {user.id === task.assigned_to && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(task.id, 'in_progress')}
              disabled={task.status === 'completed'}
            >
              Start
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(task)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={task}
      />
    </div>
  );
};
```

**Responsibilities:**
- Task information display
- Status management
- Progress tracking
- Action handling

---

### **4. Modal Components**

#### **ProjectModal.jsx**
```jsx
const ProjectModal = ({ isOpen, onClose, mode = 'create', project = null }) => {
  const { createProject, updateProject } = useProjects();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    priority: project?.priority || 'medium',
    start_date: project?.start_date || '',
    end_date: project?.end_date || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      if (mode === 'create') {
        await createProject(formData);
      } else {
        await updateProject(project.id, formData);
      }
      onClose();
    } catch (error) {
      setErrors(error.response?.data?.errors || { message: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${mode === 'create' ? 'Create' : 'Edit'} Project`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
            />
          </div>
        </div>
        
        {errors.message && (
          <div className="text-red-600 text-sm">{errors.message}</div>
        )}
        
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

**Responsibilities:**
- Form handling and validation
- Data submission
- Error management
- Loading states

---

### **5. Common Components**

#### **Button.jsx**
```jsx
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
```

#### **Input.jsx**
```jsx
const Input = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## 🔄 **Component Communication Patterns**

### **1. Props Drilling**
```jsx
// Parent component passes data down through props
const ProjectList = ({ projects, onProjectUpdate, onProjectDelete }) => {
  return (
    <div>
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onUpdate={onProjectUpdate}
          onDelete={onProjectDelete}
        />
      ))}
    </div>
  );
};
```

### **2. Context API**
```jsx
// Using context for global state
const ProjectCard = ({ project }) => {
  const { updateProject, deleteProject } = useProjects();
  
  return (
    <div>
      <button onClick={() => updateProject(project.id, { status: 'completed' })}>
        Complete
      </button>
    </div>
  );
};
```

### **3. Event Callbacks**
```jsx
// Child components communicate up through callbacks
const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  return (
    <div>
      <button onClick={() => onStatusChange(task.id, 'completed')}>
        Complete
      </button>
      <button onClick={() => onEdit(task)}>Edit</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  );
};
```

---

## 🎨 **Design System**

### **Color Palette**
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Gray Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### **Typography**
```css
/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **Spacing**
```css
/* Spacing Scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
```

---

## 📱 **Responsive Design**

### **Breakpoints**
```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### **Responsive Patterns**
```jsx
// Grid responsive layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id} item={item} />
  ))}
</div>

// Responsive navigation
<div className="hidden md:flex items-center space-x-4">
  <NavItem>Dashboard</NavItem>
  <NavItem>Projects</NavItem>
</div>

// Mobile menu
<div className="md:hidden">
  <MobileMenu />
</div>
```

---

## ⚡ **Performance Optimization**

### **1. React.memo**
```jsx
const ProjectCard = React.memo(({ project, onClick }) => {
  // Component logic
});

// Only re-renders when props change
```

### **2. useMemo**
```jsx
const filteredProjects = useMemo(() => {
  return projects.filter(project => {
    return project.status === selectedStatus;
  });
}, [projects, selectedStatus]);
```

### **3. useCallback**
```jsx
const handleProjectUpdate = useCallback((projectId, updates) => {
  updateProject(projectId, updates);
}, [updateProject]);
```

### **4. Lazy Loading**
```jsx
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Reports = lazy(() => import('./pages/Reports'));

// In router
<Suspense fallback={<Loading />}>
  <Route path="/projects/:id" element={<ProjectDetails />} />
</Suspense>
```

---

## 🧪 **Testing Strategy**

### **Component Testing**
```jsx
// Component test example
describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      status: 'active',
      priority: 'high'
    };
    
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});
```

### **Integration Testing**
```jsx
// Integration test example
describe('Project Management', () => {
  it('creates and displays a new project', async () => {
    render(<Projects />);
    
    fireEvent.click(screen.getByText('New Project'));
    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'New Test Project' }
    });
    fireEvent.click(screen.getByText('Create Project'));
    
    await waitFor(() => {
      expect(screen.getByText('New Test Project')).toBeInTheDocument();
    });
  });
});
```

This component architecture provides a scalable, maintainable, and performant foundation for the project management system frontend. 