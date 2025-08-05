import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, ArrowRight, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useProjects } from '../contexts/ProjectContext'

const ProjectCard = ({ project, viewMode = 'grid' }) => {
  console.log('ProjectCard rendering project:', project)
  console.log('Project team_size:', project.team_size)
  console.log('Project team_members:', project.team_members)
  
  const { getProjectProgress, getStatusColor, getPriorityColor, deleteProject } = useProjects()
  
  const progress = getProjectProgress(project)
  const statusColor = getStatusColor(project.status)
  const priorityColor = getPriorityColor(project.priority)

  const calculateTimeBasedProgress = () => {
    // Debug logging
    console.log('ProjectCard - Project data:', {
      id: project.id,
      name: project.name,
      team_size: project.team_size,
      team_members: project.team_members,
      start_date: project.start_date,
      end_date: project.end_date,
      total_estimated_hours: project.total_estimated_hours,
      total_time_spent: project.total_time_spent,
      progress_percentage: project.progress_percentage
    })

    // Calculate team size from different possible sources
    const teamSize = project.team_size || 
                    (project.team_members && Array.isArray(project.team_members) ? project.team_members.length : 0) ||
                    0

    // Use time-based progress if available, otherwise fall back to task completion
    if (project.total_estimated_hours > 0) {
      const timeProgress = project.total_time_spent > 0 
        ? Math.min(Math.round((project.total_time_spent / project.total_estimated_hours) * 100), 100)
        : 0
      return timeProgress
    }
    
    // Fall back to progress_percentage if available
    return project.progress_percentage || 0
  }

  const getTeamSize = () => {
    return project.team_size || 
           (project.team_members && Array.isArray(project.team_members) ? project.team_members.length : 0) ||
           0
  }

  const timeBasedProgress = calculateTimeBasedProgress()

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid date'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'completed':
        return 'Done'
      case 'on_hold':
        return 'Hold'
      case 'cancelled':
        return 'Cancel'
      default:
        return status
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low':
        return 'Low'
      case 'medium':
        return 'Med'
      case 'high':
        return 'High'
      case 'urgent':
        return 'Urgent'
      default:
        return priority
    }
  }

  const handleDeleteProject = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(project.id)
        // The parent component should handle the refresh
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project. Please try again.')
      }
    }
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div className="card hover:shadow-md transition-shadow duration-200">
        <Link to={`/projects/${project.id}`} className="block cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Project Info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-1 mb-2">
                  {project.description || 'No description available'}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Progress</span>
                    <span className="text-xs text-gray-500">{timeBasedProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${timeBasedProgress}%` }}
                    />
                  </div>
                  {project.total_estimated_hours > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {project.total_time_spent || 0}h / {project.total_estimated_hours}h logged
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {/* Status and Priority */}
                  <span className={`status-badge status-${statusColor}`}>
                    {getStatusText(project.status)}
                  </span>
                  <span className={`priority-badge priority-${priorityColor}`}>
                    {getPriorityText(project.priority)}
                  </span>
                  
                  {/* Dates */}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {project.start_date ? formatDate(project.start_date) : 'No start date'}
                    </span>
                  </div>
                  
                  {/* Team Size */}
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {getTeamSize()} {getTeamSize() === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4 flex items-center space-x-2">
              <button
                onClick={handleDeleteProject}
                className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                title="Delete Project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <Link to={`/projects/${project.id}`} className="block cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
              {project.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {project.description || 'No description available'}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`status-badge status-${statusColor}`}>
              {getStatusText(project.status)}
            </span>
            <span className={`priority-badge priority-${priorityColor}`}>
              {getPriorityText(project.priority)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{timeBasedProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${timeBasedProgress}%` }}
            />
          </div>
          {project.total_estimated_hours > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {project.total_time_spent || 0}h / {project.total_estimated_hours}h logged
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {project.start_date ? formatDate(project.start_date) : 'No start date'}
              {project.end_date && ` - ${formatDate(project.end_date)}`}
            </span>
          </div>

          {project.budget && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>Budget: ${project.budget.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              <span>
                {getTeamSize()} {getTeamSize() === 1 ? 'team member' : 'team members'}
              </span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Delete button outside the link to prevent navigation when clicking delete */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleDeleteProject}
          className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
          title="Delete Project"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default ProjectCard 