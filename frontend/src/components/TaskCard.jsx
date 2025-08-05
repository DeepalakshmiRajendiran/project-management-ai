import React from 'react'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  TrendingUp,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

const TaskCard = ({ 
  task, 
  viewMode = 'grid',
  onEdit, 
  onDelete, 
  onViewDetails
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <TrendingUp className="h-4 w-4" />
      case 'review':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const isOverdue = () => {
    if (task.status === 'completed') return false
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date()
  }

  const getDaysRemaining = () => {
    if (!task.due_date) return null
    const dueDate = new Date(task.due_date)
    const today = new Date()
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateTimeBasedProgress = () => {
    // If no estimated hours, fall back to manual progress percentage
    if (!task.estimated_hours || task.estimated_hours <= 0) {
      return task.progress_percentage || 0
    }

    // If no time spent, return 0
    if (!task.total_time_spent || task.total_time_spent <= 0) {
      return 0
    }

    // Calculate progress based on time spent vs estimated hours
    const progress = Math.min((task.total_time_spent / task.estimated_hours) * 100, 100)
    return Math.round(progress)
  }

  const daysRemaining = getDaysRemaining()
  const timeBasedProgress = calculateTimeBasedProgress()

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-4 flex-1">
          {/* Status */}
          <div className={`p-2 rounded-full ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
              {isOverdue() && (
                <span className="text-red-600 text-sm font-medium">OVERDUE</span>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600 truncate">{task.description}</p>
            )}

            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'MMM dd')}</span>
                  {daysRemaining !== null && (
                    <span className={daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-gray-500'}>
                      ({daysRemaining < 0 ? `${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`})
                    </span>
                  )}
                </div>
              )}
              
              {task.assigned_user && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{task.assigned_user.first_name} {task.assigned_user.last_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority and Progress */}
        <div className="flex items-center space-x-4">
          <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
            {task.priority === 'medium' ? 'Med' : task.priority}
          </span>
          
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(timeBasedProgress)}`}
                style={{ width: `${timeBasedProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{timeBasedProgress}%</span>
            {task.total_time_spent > 0 && (
              <span className="text-xs text-gray-500">
                ({task.total_time_spent}h / {task.estimated_hours || '?'}h)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewDetails(task)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Task"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-2">{task.title}</h3>
            {isOverdue() && (
              <span className="text-red-600 text-xs font-medium">OVERDUE</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewDetails(task)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Task"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">{timeBasedProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor(timeBasedProgress)}`}
            style={{ width: `${timeBasedProgress}%` }}
          />
        </div>
        {task.total_time_spent > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {task.total_time_spent}h / {task.estimated_hours || '?'}h logged
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        {task.due_date && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
            {daysRemaining !== null && (
              <span className={daysRemaining < 0 ? 'text-red-600 font-medium' : daysRemaining <= 3 ? 'text-yellow-600 font-medium' : ''}>
                ({daysRemaining < 0 ? `${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`})
              </span>
            )}
          </div>
        )}
        
        {task.assigned_user && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span>{task.assigned_user.first_name} {task.assigned_user.last_name}</span>
          </div>
        )}
        
        {task.estimated_hours && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{task.estimated_hours}h estimated</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center justify-between">
        <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        
        <span className={`status-badge ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

export default TaskCard 