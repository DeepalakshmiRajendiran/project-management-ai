# State Management Approach
## Project Management System - Frontend

---

## 🧠 **State Management Overview**

### **Architecture Pattern**
```
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layers                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Global State  │    │   Local State   │                │
│  │   (Context)     │    │   (useState)    │                │
│  │                 │    │                 │                │
│  │ - Authentication│    │ - Form Data     │                │
│  │ - User Profile  │    │ - UI State      │                │
│  │ - Notifications │    │ - Modal State   │                │
│  │ - Theme/Settings│    │ - Loading State │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Server State  │    │   Derived State │                │
│  │   (API Data)    │    │   (useMemo)     │                │
│  │                 │    │                 │                │
│  │ - Projects      │    │ - Filtered Data │                │
│  │ - Tasks         │    │ - Computed Stats│                │
│  │ - Team Members  │    │ - Sorted Lists  │                │
│  │ - Time Logs     │    │ - Aggregated    │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 **State Management Strategy**

### **1. React Context API for Global State**
- **Authentication State**: User login/logout, profile data
- **Application State**: Theme, language, notifications
- **Shared Data**: Projects, tasks, team members

### **2. Local State for Component-Specific Data**
- **Form Data**: Input values, validation states
- **UI State**: Modal visibility, loading states, selections
- **Temporary Data**: Search queries, filters, pagination

### **3. Server State Management**
- **API Integration**: Data fetching, caching, synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Network errors, validation errors

---

## 🔄 **Context Providers**

### **AuthContext.jsx**
```jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getProfile();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data, token }
          });
        } catch (error) {
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error.message
          });
          localStorage.removeItem('token');
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Login failed'
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Registration failed'
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### **ProjectContext.jsx**
```jsx
import { createContext, useContext, useReducer, useCallback } from 'react';
import { projectsAPI } from '../services/api';

const ProjectContext = createContext();

const initialState = {
  projects: [],
  tasks: [],
  teamMembers: [],
  timeLogs: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    priority: 'all',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, loading: false };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.payload, ...state.projects],
        loading: false
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        loading: false
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        loading: false
      };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        loading: false
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
        loading: false
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        loading: false
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }
      };
    
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };
    
    default:
      return state;
  }
};

export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Fetch projects
  const fetchProjects = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.getProjects(filters);
      dispatch({ type: 'SET_PROJECTS', payload: response.data.projects });
      dispatch({ type: 'SET_PAGINATION', payload: response.data.pagination });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  // Create project
  const createProject = useCallback(async (projectData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.createProject(projectData);
      dispatch({ type: 'ADD_PROJECT', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.updateProject(projectId, updates);
      dispatch({ type: 'UPDATE_PROJECT', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await projectsAPI.deleteProject(projectId);
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async (projectId = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.getTasks(projectId);
      dispatch({ type: 'SET_TASKS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  // Create task
  const createTask = useCallback(async (taskData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Update task
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.updateTask(taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Delete task
  const deleteTask = useCallback(async (taskId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await projectsAPI.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = {
    ...state,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setFilters,
    clearError
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
```

### **NotificationContext.jsx**
```jsx
import { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
        unreadCount: state.notifications.find(n => n.id === action.payload)?.read
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1)
      };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      };
    
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id, timestamp: new Date(), read: false, ...notification }
    });
  }, []);

  const markAsRead = useCallback((notificationId) => {
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  const removeNotification = useCallback((notificationId) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  }, []);

  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      message,
      icon: 'check-circle'
    });
  }, [addNotification]);

  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      message,
      icon: 'alert-circle'
    });
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      message,
      icon: 'info'
    });
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      message,
      icon: 'alert-triangle'
    });
  }, [addNotification]);

  const value = {
    ...state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
```

---

## 🎣 **Custom Hooks**

### **useLocalStorage.js**
```jsx
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
```

### **useDebounce.js**
```jsx
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### **useAsync.js**
```jsx
import { useState, useCallback } from 'react';

export const useAsync = (asyncFunction) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...params) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFunction(...params);
      setState({ data, loading: false, error: null });
      return { success: true, data };
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  }, [asyncFunction]);

  return { ...state, execute };
};
```

### **useForm.js**
```jsx
import { useState, useCallback } from 'react';

export const useForm = (initialValues, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    if (validationSchema) {
      try {
        validationSchema.validateSyncAt(field, values);
        setErrors(prev => ({ ...prev, [field]: null }));
      } catch (error) {
        setErrors(prev => ({ ...prev, [field]: error.message }));
      }
    }
  }, [validationSchema, values]);

  const validate = useCallback(() => {
    if (!validationSchema) return true;
    
    try {
      validationSchema.validateSync(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationErrors) {
      const newErrors = {};
      validationErrors.inner.forEach(error => {
        newErrors[error.path] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
  }, [validationSchema, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0
  };
};
```

---

## 📊 **Data Flow Patterns**

### **1. Top-Down Data Flow**
```jsx
// Parent component passes data down
const ProjectList = () => {
  const { projects, loading, error } = useProjects();
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project}
          onUpdate={updateProject}
          onDelete={deleteProject}
        />
      ))}
    </div>
  );
};
```

### **2. Event-Driven Updates**
```jsx
// Child components trigger updates
const ProjectCard = ({ project, onUpdate, onDelete }) => {
  const handleStatusChange = (newStatus) => {
    onUpdate(project.id, { status: newStatus });
  };
  
  return (
    <div>
      <button onClick={() => handleStatusChange('completed')}>
        Complete
      </button>
    </div>
  );
};
```

### **3. Optimistic Updates**
```jsx
// Immediate UI feedback
const useOptimisticUpdate = (updateFunction) => {
  const [optimisticData, setOptimisticData] = useState(null);
  
  const optimisticUpdate = useCallback(async (id, updates) => {
    // Apply optimistic update immediately
    setOptimisticData({ id, updates });
    
    try {
      const result = await updateFunction(id, updates);
      setOptimisticData(null);
      return result;
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticData(null);
      throw error;
    }
  }, [updateFunction]);
  
  return { optimisticUpdate, optimisticData };
};
```

---

## 🔄 **State Synchronization**

### **1. Real-Time Updates**
```jsx
// WebSocket integration for real-time updates
const useRealTimeUpdates = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (!user) return;
    
    const socket = io(process.env.REACT_APP_WS_URL);
    
    socket.on('task_updated', (data) => {
      // Update local state
      updateTask(data.taskId, data.updates);
      
      // Show notification
      addNotification({
        type: 'info',
        message: `Task "${data.taskTitle}" was updated`
      });
    });
    
    socket.on('project_created', (data) => {
      addProject(data.project);
      addNotification({
        type: 'success',
        message: `New project "${data.project.name}" was created`
      });
    });
    
    return () => socket.disconnect();
  }, [user, addNotification]);
};
```

### **2. Background Sync**
```jsx
// Sync data in background
const useBackgroundSync = () => {
  const { fetchProjects, fetchTasks } = useProjects();
  
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchProjects();
      fetchTasks();
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(syncInterval);
  }, [fetchProjects, fetchTasks]);
};
```

---

## 🎯 **Performance Optimization**

### **1. Memoization**
```jsx
// Memoize expensive calculations
const useProjectStats = (projects) => {
  return useMemo(() => {
    return projects.reduce((stats, project) => {
      stats.totalProjects++;
      stats.activeProjects += project.status === 'active' ? 1 : 0;
      stats.completedProjects += project.status === 'completed' ? 1 : 0;
      return stats;
    }, { totalProjects: 0, activeProjects: 0, completedProjects: 0 });
  }, [projects]);
};
```

### **2. Selective Re-renders**
```jsx
// Prevent unnecessary re-renders
const ProjectCard = React.memo(({ project, onUpdate, onDelete }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.project.id === nextProps.project.id &&
         prevProps.project.status === nextProps.project.status;
});
```

### **3. Lazy Loading**
```jsx
// Lazy load components and data
const ProjectDetails = lazy(() => import('./ProjectDetails'));

const ProjectList = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  
  return (
    <div>
      {selectedProject && (
        <Suspense fallback={<Loading />}>
          <ProjectDetails projectId={selectedProject.id} />
        </Suspense>
      )}
    </div>
  );
};
```

---

## 🧪 **Testing State Management**

### **1. Context Testing**
```jsx
// Test context providers
describe('AuthContext', () => {
  it('provides authentication state', () => {
    const TestComponent = () => {
      const { isAuthenticated, user } = useAuth();
      return (
        <div>
          <span data-testid="auth-status">{isAuthenticated.toString()}</span>
          <span data-testid="user-name">{user?.name || ''}</span>
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('false');
  });
});
```

### **2. Hook Testing**
```jsx
// Test custom hooks
describe('useForm', () => {
  it('manages form state correctly', () => {
    const { result } = renderHook(() => useForm({ name: '', email: '' }));
    
    act(() => {
      result.current.handleChange('name', 'John Doe');
    });
    
    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.isValid).toBe(true);
  });
});
```

This state management approach provides a robust, scalable, and performant foundation for managing application state in the project management system. 