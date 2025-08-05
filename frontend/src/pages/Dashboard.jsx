import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Users,
  FolderOpen,
  Home
} from 'lucide-react'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import LiveUpdates from '../components/LiveUpdates'

const Dashboard = () => {
  const { projects, loading, error, refreshProjects } = useProjects()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    teamMembers: 0
  })

  // Show loading if auth is still loading or projects are loading
  const isLoading = authLoading || loading

  useEffect(() => {
    if (projects.length > 0) {
      console.log('Dashboard - Full Projects data:', projects)
      console.log('Dashboard - Projects data summary:', projects.map(p => ({
        id: p.id,
        name: p.name,
        team_size: p.team_size,
        tasks_count: p.tasks_count,
        completed_tasks_count: p.completed_tasks_count,
        start_date: p.start_date,
        end_date: p.end_date,
        progress_percentage: p.progress_percentage,
        total_estimated_hours: p.total_estimated_hours,
        total_time_spent: p.total_time_spent,
        status: p.status
      })))
      calculateStats()
    }
  }, [projects])

  const calculateStats = () => {
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    
    // Calculate tasks - use tasks_count from project data if available
    const totalTasks = projects.reduce((total, p) => total + (parseInt(p.tasks_count) || 0), 0)
    const completedTasks = projects.reduce((total, p) => total + (parseInt(p.completed_tasks_count) || 0), 0)
    const overdueTasks = projects.reduce((total, p) => total + (parseInt(p.overdue_tasks_count) || 0), 0)

    // Calculate unique team members - use the maximum team size as approximation
    // This assumes that the largest team contains most/all unique members
    const teamSizes = projects.map(p => parseInt(p.team_size) || 0)
    const maxTeamSize = Math.max(...teamSizes, 0)
    
    // If we have multiple projects with similar team sizes, it might indicate shared members
    // For now, we'll use the maximum as a reasonable approximation
    const estimatedUniqueMembers = maxTeamSize

    console.log('Dashboard Stats Calculation:', {
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        tasks_count: p.tasks_count,
        tasks_count_parsed: parseInt(p.tasks_count) || 0,
        completed_tasks_count: p.completed_tasks_count,
        completed_tasks_count_parsed: parseInt(p.completed_tasks_count) || 0,
        team_size: p.team_size,
        team_size_parsed: parseInt(p.team_size) || 0,
        status: p.status
      })),
      teamSizes,
      maxTeamSize,
      calculatedStats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        teamMembers: estimatedUniqueMembers
      }
    })

    setStats({
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      teamMembers: estimatedUniqueMembers
    })
  }

  const getRecentProjects = () => {
    return projects
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  }

  const getProjectProgress = (project) => {
    // Use time-based progress if available
    if (project.progress_percentage !== undefined) {
      return project.progress_percentage
    }
    
    // Fallback to task-based progress
    if (!project.tasks || project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Home className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications Badge */}
          
          <Link
            to="/projects/new"
            className="btn btn-primary flex items-center space-x-2"
            title="Create New Project"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={refreshProjects}
              className="btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-xl p-8 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Team</p>
              <p className="text-3xl font-bold text-gray-900">{stats.teamMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-8 py-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
        </div>
        <div className="divide-y">
          {getRecentProjects().map((project) => (
            <div key={project.id} className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {project.name}
                    </Link>
                    <span className={`priority-badge ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getProjectProgress(project)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${getProjectProgress(project)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {project.team_size || 0} {project.team_size === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/projects/new"
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Create Project</h3>
              <p className="text-sm text-gray-600">Start a new project</p>
            </div>
          </div>
        </Link>

        <Link
          to="/time-tracking"
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Track Time</h3>
              <p className="text-sm text-gray-600">Log your work hours</p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Analytics and insights</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Live Updates Component */}
      <LiveUpdates />
    </div>
  )
}

export default Dashboard