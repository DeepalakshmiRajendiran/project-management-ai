import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { projectsAPI, milestonesAPI, tasksAPI } from '../services/api'
import { useAuth } from './AuthContext'

const ProjectContext = createContext()

export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, onLogin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  })

  const fetchProjects = useCallback(async (params = {}) => {
    // Don't fetch if not authenticated or auth is still loading
    if (!isAuthenticated || authLoading) {
      console.log('Skipping project fetch - not authenticated or auth loading')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching projects with filters:', { ...filters, ...params })
      const response = await projectsAPI.getAll({ ...filters, ...params })
      console.log('Projects response:', response.data)
      
      // Handle nested data structure from backend
      const projectsData = response.data.data || response.data.projects || response.data
      const projectsArray = Array.isArray(projectsData) ? projectsData : []
      
      // Extract unique team members count if available
      const uniqueTeamMembers = response.data.uniqueTeamMembers || 0
      
      console.log('Processed projects data:', {
        projectsCount: projectsArray.length,
        uniqueTeamMembers,
        sampleProject: projectsArray[0]
      })
      
      setProjects(projectsArray)
      
      // Store unique team members count for dashboard use
      if (uniqueTeamMembers > 0) {
        console.log('Setting unique team members count:', uniqueTeamMembers)
        // You can store this in a separate state or pass it through context
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setError('Failed to load projects')
      setProjects([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [filters, isAuthenticated, authLoading])

  const refreshProjects = useCallback(async () => {
    console.log('Manual refresh of projects triggered')
    await fetchProjects()
  }, [fetchProjects])

  // Register callback to refresh projects after login
  useEffect(() => {
    onLogin(() => {
      console.log('Login detected, refreshing projects...')
      refreshProjects()
    })
  }, [onLogin, refreshProjects])

  const getProjectById = useCallback(async (id) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      console.log('Skipping getProjectById - not authenticated')
      return null
    }

    try {
      console.log('getProjectById called with ID:', id)
      setLoading(true)
      setError(null)
      const response = await projectsAPI.getById(id)
      console.log('getProjectById response:', response.data)
      // Handle nested data structure from backend
      const result = response.data.data || response.data
      console.log('getProjectById result:', result)
      return result
    } catch (error) {
      console.error('Failed to fetch project:', error)
      console.error('Error details:', error.response?.data)
      setError('Failed to load project details')
      return null
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const createProject = async (projectData) => {
    try {
      console.log('ProjectContext createProject called with:', projectData)
      
      // Prevent duplicate submissions
      if (loading) {
        console.log('Project creation already in progress, ignoring')
        return { success: false, error: 'Project creation already in progress' }
      }
      
      // Check if project with same name already exists
      const existingProject = projects.find(p => p.name === projectData.name)
      if (existingProject) {
        console.log('Project with same name already exists:', existingProject)
        return { success: false, error: 'A project with this name already exists' }
      }
      
      setLoading(true)
      setError(null)
      
      const submissionId = Date.now()
      console.log('Making API call for project creation with ID:', submissionId)
      
      const response = await projectsAPI.create(projectData)
      console.log('ProjectContext createProject response for ID:', submissionId, response.data)
      
      const newProject = response.data.data || response.data
      console.log('ProjectContext newProject for ID:', submissionId, newProject)
      
      setProjects(prev => [...prev, newProject])
      return { success: true, project: newProject }
    } catch (error) {
      console.error('ProjectContext createProject error:', error)
      const message = error.response?.data?.message || 'Failed to create project'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id, projectData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectsAPI.update(id, projectData)
      const updatedProject = response.data.data || response.data
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
      return { success: true, project: updatedProject }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update project'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id) => {
    try {
      setLoading(true)
      setError(null)
      await projectsAPI.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete project'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getProjectMilestones = useCallback(async (projectId) => {
    try {
      const response = await milestonesAPI.getByProject(projectId)
      console.log('getProjectMilestones response:', response)
      
      // Handle different response structures
      const milestonesData = response.data?.data || response.data || []
      console.log('getProjectMilestones milestonesData:', milestonesData)
      
      // Ensure we always return an array
      if (Array.isArray(milestonesData)) {
        return milestonesData
      } else {
        console.error('Milestones data is not an array:', milestonesData)
        return []
      }
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
      return []
    }
  }, [])

  const getProjectTasks = useCallback(async (projectId) => {
    try {
      console.log('getProjectTasks called with projectId:', projectId)
      const response = await tasksAPI.getByProject(projectId)
      console.log('getProjectTasks response:', response)
      
      // Handle different response structures
      const tasksData = response.data?.data || response.data || []
      console.log('getProjectTasks tasksData:', tasksData)
      
      // Ensure we always return an array
      if (Array.isArray(tasksData)) {
        console.log('Returning tasks array with length:', tasksData.length)
        return tasksData
      } else {
        console.error('Tasks data is not an array:', tasksData)
        return []
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      return []
    }
  }, [])

  const getProjectStats = useCallback(async (projectId) => {
    try {
      const response = await projectsAPI.getStats(projectId)
      console.log('getProjectStats response:', response)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch project stats:', error)
      return null
    }
  }, [])

  const getMilestoneById = async (milestoneId) => {
    try {
      const response = await milestonesAPI.getById(milestoneId)
      return response.data
    } catch (error) {
      console.error('Failed to fetch milestone:', error)
      return null
    }
  }

  const getMilestoneTasks = async (milestoneId) => {
    try {
      const response = await milestonesAPI.getTasks(milestoneId)
      console.log('getMilestoneTasks response:', response)
      
      // Handle different response structures
      const tasksData = response.data?.data || response.data || []
      console.log('getMilestoneTasks tasksData:', tasksData)
      
      // Ensure we always return an array
      if (Array.isArray(tasksData)) {
        return tasksData
      } else {
        console.error('Milestone tasks data is not an array:', tasksData)
        return []
      }
    } catch (error) {
      console.error('Failed to fetch milestone tasks:', error)
      return []
    }
  }

  const createMilestone = async (milestoneData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await milestonesAPI.create(milestoneData)
      return { success: true, milestone: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create milestone'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateMilestone = async (milestoneId, milestoneData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await milestonesAPI.update(milestoneId, milestoneData)
      return { success: true, milestone: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update milestone'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteMilestone = async (milestoneId) => {
    try {
      setLoading(true)
      setError(null)
      await milestonesAPI.delete(milestoneId)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete milestone'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksAPI.create(taskData)
      return { success: true, task: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (taskId, taskData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksAPI.update(taskId, taskData)
      return { success: true, task: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      setLoading(true)
      setError(null)
      await tasksAPI.delete(taskId)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const assignTask = async (taskId, userId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksAPI.assign(taskId, userId)
      return { success: true, task: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to assign task'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateTaskProgress = async (taskId, progress) => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksAPI.updateProgress(taskId, progress)
      return { success: true, task: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task progress'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksAPI.updateStatus(taskId, status)
      return { success: true, task: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task status'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: '',
    })
  }

  const getFilteredProjects = () => {
    // Ensure projects is always an array
    if (!Array.isArray(projects)) {
      console.warn('Projects is not an array:', projects)
      return []
    }
    
    return projects.filter(project => {
      if (filters.status && project.status !== filters.status) return false
      if (filters.priority && project.priority !== filters.priority) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }

  const getProjectProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0
    
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'primary'
      case 'on_hold':
        return 'warning'
      case 'cancelled':
        return 'danger'
      default:
        return 'gray'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'gray'
      case 'medium':
        return 'blue'
      case 'high':
        return 'warning'
      case 'urgent':
        return 'danger'
      default:
        return 'gray'
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [filters, isAuthenticated, authLoading])

  const value = {
    projects,
    loading,
    error,
    filters,
    fetchProjects,
    refreshProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectMilestones,
    getProjectTasks,
    getProjectStats,
    getMilestoneById,
    getMilestoneTasks,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskProgress,
    updateTaskStatus,
    updateFilters,
    clearFilters,
    getFilteredProjects,
    getProjectProgress,
    getStatusColor,
    getPriorityColor,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
} 