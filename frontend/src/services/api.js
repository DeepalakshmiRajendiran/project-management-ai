import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    console.log('API Request - URL:', config.url, 'Token exists:', !!token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.log('No auth token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Response Error:', error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      // Don't redirect here - let the AuthContext handle it
      console.log('Unauthorized request - token cleared')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// Projects API
export const projectsAPI = {
  getAll: (params = {}) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
}

// Milestones API
export const milestonesAPI = {
  getByProject: (projectId) => api.get(`/milestones/project/${projectId}`),
  getById: (id) => api.get(`/milestones/${id}`),
  create: (data) => api.post('/milestones', data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  updateStatus: (id, status) => api.patch(`/milestones/${id}/status`, { status }),
  delete: (id) => api.delete(`/milestones/${id}`),
  getOverdue: () => api.get('/milestones/overdue'),
  getUpcoming: () => api.get('/milestones/upcoming'),
  getTasks: (milestoneId) => api.get(`/milestones/${milestoneId}/tasks`),
}

// Tasks API
export const tasksAPI = {
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  assign: (id, userId) => api.patch(`/tasks/${id}/assign`, { assigned_to: userId }),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  updateProgress: (id, progress) => api.patch(`/tasks/${id}/progress`, { progress_percentage: progress }),
  delete: (id) => api.delete(`/tasks/${id}`),
  getAssigned: () => api.get('/tasks/user/assigned'),
  getOverdue: () => api.get('/tasks/overdue'),
  updateProgressAndStatus: (id, data) => api.patch(`/tasks/${id}/progress-status`, data),
}

// Team Management API
export const teamAPI = {
  // User Management
  getUsers: (params = {}) => api.get('/team/users', { params }),
  getUserById: (id) => api.get(`/team/users/${id}`),
  createUser: (data) => api.post('/team/users', data),
  updateUser: (id, data) => api.put(`/team/users/${id}`, data),
  deleteUser: (id) => api.delete(`/team/users/${id}`),
  
  // Team Management
  getTeamMembers: (projectId) => api.get(`/team/project/${projectId}`),
  addTeamMember: (projectId, data) => api.post(`/team/project/${projectId}/members`, data),
  updateTeamMember: (projectId, userId, data) => api.put(`/team/project/${projectId}/members/${userId}/role`, data),
  removeTeamMember: (projectId, userId) => api.delete(`/team/project/${projectId}/members/${userId}`),
  
  // Role Management
  assignRole: (userId, projectId, data) => api.post(`/team/project/${projectId}/members`, { user_id: userId, ...data }),
  updateRole: (userId, projectId, data) => api.put(`/team/project/${projectId}/members/${userId}/role`, data),
  removeRole: (userId, projectId) => api.delete(`/team/project/${projectId}/members/${userId}`),
  
  // Invitations
  inviteUser: (data) => api.post('/invitations', data),
  getInvitations: (params = {}) => api.get('/invitations', { params }),
  getInvitationByToken: (token) => api.get(`/invitations/token/${token}`),
  acceptInvitation: (invitationId, userData) => api.post(`/invitations/${invitationId}/accept`, userData),
  declineInvitation: (invitationId) => api.post(`/invitations/${invitationId}/decline`),
  resendInvitation: (invitationId) => api.post(`/invitations/${invitationId}/resend`),
  cancelInvitation: (invitationId) => api.delete(`/invitations/${invitationId}`),
  
  // User Stats
  getUserStats: () => api.get('/team/user/stats'),
  
  // Team Analytics (not implemented in backend yet)
  getTeamStats: (projectId) => api.get(`/projects/${projectId}/team/stats`),
  getTeamActivity: (projectId, params = {}) => api.get(`/projects/${projectId}/team/activity`, { params }),
  getRoleBreakdown: (projectId) => api.get(`/projects/${projectId}/team/roles`),
  
  // User Projects
  getUserProjects: () => api.get('/team/user/projects'),
  getUserAssignedTasks: (params = {}) => api.get('/team/user/assigned-tasks', { params }),
  
  // Permissions (not implemented in backend yet)
  getUserPermissions: (userId, projectId) => api.get(`/users/${userId}/projects/${projectId}/permissions`),
  updateUserPermissions: (userId, projectId, data) => api.put(`/users/${userId}/projects/${projectId}/permissions`, data),
  
  // Bulk Operations (not implemented in backend yet)
  bulkInviteUsers: (data) => api.post('/invitations/bulk', data),
  bulkAssignRoles: (data) => api.post('/users/bulk/roles', data),
  bulkUpdateTeam: (projectId, data) => api.put(`/projects/${projectId}/team/bulk`, data),
}

// Comments API
export const commentsAPI = {
  getByTask: (taskId) => api.get(`/comments/task/${taskId}`),
  getByProject: (projectId) => api.get(`/comments/project/${projectId}`),
  getById: (id) => api.get(`/comments/${id}`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
}

// Calendar Events API
export const eventsAPI = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getByProject: (projectId) => api.get(`/events/project/${projectId}`),
  getByDate: (date) => api.get(`/events/date/${date}`),
  getUpcoming: () => api.get('/events/upcoming'),
  getToday: () => api.get('/events/today'),
}

// Time Tracking API
export const timeAPI = {
  getAll: (params = {}) => api.get('/time-logs', { params }),
  getById: (id) => api.get(`/time-logs/${id}`),
  create: (data) => api.post('/time-logs', data),
  update: (id, data) => api.put(`/time-logs/${id}`, data),
  delete: (id) => api.delete(`/time-logs/${id}`),
  getByUser: (userId, params = {}) => api.get(`/time-logs/user/${userId}`, { params }),
  getByProject: (projectId, params = {}) => api.get(`/time-logs/project/${projectId}`, { params }),
  getByTask: (taskId, params = {}) => api.get(`/time-logs/task/${taskId}`, { params }),
  getByDate: (date) => api.get(`/time-logs/date/${date}`),
  getByDateRange: (startDate, endDate) => api.get(`/time-logs/range/${startDate}/${endDate}`),
  getSummary: (params = {}) => api.get('/time-logs/summary', { params }),
  getBillableHours: (params = {}) => api.get('/time-logs/billable', { params }),
  getCategoryBreakdown: (params = {}) => api.get('/time-logs/categories', { params }),
  getUserBreakdown: (params = {}) => api.get('/time-logs/users', { params }),
  getProjectBreakdown: (params = {}) => api.get('/time-logs/projects', { params }),
  exportTimesheet: (params = {}) => api.get('/time-logs/export', { params, responseType: 'blob' }),
}

// Notifications API
export const notificationAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  create: (data) => api.post('/notifications', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  delete: (id) => api.delete(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getByUser: (userId, params = {}) => api.get(`/notifications/user/${userId}`, { params }),
  getByType: (type, params = {}) => api.get(`/notifications/type/${type}`, { params }),
  sendNotification: (data) => api.post('/notifications/send', data),
  subscribeToNotifications: (userId) => api.post(`/notifications/subscribe/${userId}`),
  unsubscribeFromNotifications: (userId) => api.post(`/notifications/unsubscribe/${userId}`),
}

// Reports API - Aggregates data from existing endpoints
export const reportsAPI = {
  // Overview statistics
  getOverviewStats: (params = {}) => api.get('/projects', { params }),
  
  // Project statistics
  getProjectStats: (projectId) => api.get(`/projects/${projectId}/stats`),
  
  // Time tracking reports
  getTimeSummary: (params = {}) => api.get('/time-logs/summary', { params }),
  getTimeBreakdown: (params = {}) => api.get('/time-logs/projects', { params }),
  getTimeByDateRange: (startDate, endDate) => api.get(`/time-logs/range/${startDate}/${endDate}`),
  
  // Task statistics
  getTaskStats: (params = {}) => api.get('/tasks', { params }),
  
  // User statistics
  getUserStats: () => api.get('/team/user/stats'),
}

export default api 