import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Plus,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { timeAPI, tasksAPI, projectsAPI } from '../services/api'

const TimeTracking = () => {
  const [timeLogs, setTimeLogs] = useState([])
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTimeLogForm, setShowTimeLogForm] = useState(false)
  const [selectedTimeLog, setSelectedTimeLog] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [timeLogsRes, projectsRes] = await Promise.all([
        timeAPI.getAll(),
        projectsAPI.getAll()
      ])

                    // Get all tasks for all projects the user has access to
       const allTasks = []
       const projectsData = projectsRes.data?.data || projectsRes.data || []
       
       // Only fetch tasks for projects the user has access to
       for (const project of projectsData) {
         try {
           const projectTasksRes = await tasksAPI.getByProject(project.id)
           const projectTasks = projectTasksRes.data?.data || projectTasksRes.data || []
           allTasks.push(...projectTasks)
         } catch (error) {
           console.warn(`Failed to fetch tasks for project ${project.id}:`, error)
           // If access is denied, skip this project's tasks
           if (error.response?.data?.error?.includes('Access denied')) {
             console.log(`Skipping project ${project.id} - access denied`)
             continue
           }
         }
       }

              const timeLogsData = timeLogsRes.data?.data || timeLogsRes.data || []

       setTimeLogs(timeLogsData)
      setTasks(allTasks)
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to load time tracking data:', error)
      setError('Failed to load time tracking data')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeLogAdd = async (timeLogData) => {
    try {
      const response = await timeAPI.create(timeLogData)
      const newTimeLog = response.data?.data || response.data
      setTimeLogs(prev => [...prev, newTimeLog])
      setShowTimeLogForm(false)
      return { success: true }
    } catch (error) {
      console.error('Failed to add time log:', error)
      throw error
    }
  }

  const handleTimeLogUpdate = async (timeLogId, timeLogData) => {
    try {
      const response = await timeAPI.update(timeLogId, timeLogData)
      const updatedTimeLog = response.data?.data || response.data
      setTimeLogs(prev => prev.map(log => log.id === timeLogId ? updatedTimeLog : log))
      setShowTimeLogForm(false)
      setSelectedTimeLog(null)
      return { success: true }
    } catch (error) {
      console.error('Failed to update time log:', error)
      throw error
    }
  }

  const handleTimeLogDelete = async (timeLogId) => {
    if (window.confirm('Are you sure you want to delete this time log?')) {
      try {
        await timeAPI.delete(timeLogId)
        setTimeLogs(prev => prev.filter(log => log.id !== timeLogId))
        return { success: true }
      } catch (error) {
        console.error('Failed to delete time log:', error)
        throw error
      }
    }
  }

  const getTotalHours = () => {
    const total = timeLogs.reduce((total, log) => {
      const hours = parseFloat(log.hours_spent) || 0
      return total + hours
    }, 0)
    return isNaN(total) ? 0 : total
  }

  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading time tracking data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">
            Track your time spent on projects and tasks
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTimeLog(null)
            setShowTimeLogForm(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Log Time</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Simple Stats */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Hours Logged</p>
                         <p className="text-lg font-bold text-gray-900">{(getTotalHours() || 0).toFixed(1)}h</p>
          </div>
        </div>
      </div>

      {/* Time Logs List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Time Logs</h2>
        </div>
        
        {timeLogs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time logs yet</h3>
            <p className="text-gray-600">
              Start tracking your time by logging your first entry using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.project_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.task_title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(log.hours_spent * 60)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.description || '-'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTimeLog(log)
                          setShowTimeLogForm(true)
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTimeLogDelete(log.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Time Log Form Modal */}
      {showTimeLogForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTimeLogForm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTimeLog ? 'Edit Time Log' : 'Log Time'}
                  </h3>
                  <button
                    onClick={() => setShowTimeLogForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <SimpleTimeLogForm
                timeLog={selectedTimeLog}
                projects={projects}
                tasks={tasks}
                onSave={selectedTimeLog ? handleTimeLogUpdate : handleTimeLogAdd}
                onClose={() => setShowTimeLogForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Time Log Form Component
const SimpleTimeLogForm = ({ timeLog, projects, tasks, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    task_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (timeLog) {
      // Safely format the date
      let formattedDate = format(new Date(), 'yyyy-MM-dd')
      if (timeLog.date) {
        try {
          const date = new Date(timeLog.date)
          if (!isNaN(date.getTime())) {
            formattedDate = format(date, 'yyyy-MM-dd')
          }
        } catch (error) {
          console.warn('Invalid date in timeLog:', timeLog.date)
        }
      }
      
             setFormData({
         project_id: timeLog.project_id || '',
         task_id: timeLog.task_id || '',
         date: formattedDate,
         hours: (parseFloat(timeLog.hours_spent) || 0).toFixed(2),
         description: timeLog.description || ''
       })
    }
  }, [timeLog])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required'
    }
    
    if (!formData.task_id) {
      newErrors.task_id = 'Task is required'
    }
    
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours must be greater than 0'
    }
    
    if (parseFloat(formData.hours) > 24) {
      newErrors.hours = 'Hours cannot exceed 24'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const timeLogData = {
        hours_spent: parseFloat(formData.hours),
        date: formData.date,
        task_id: formData.task_id,
        project_id: formData.project_id
      }

      // Only add description if it's not empty
      if (formData.description && formData.description.trim()) {
        timeLogData.description = formData.description.trim()
      }

      if (timeLog) {
        await onSave(timeLog.id, timeLogData)
      } else {
        await onSave(timeLogData)
      }
    } catch (error) {
      console.error('Failed to save time log:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => task.project_id === formData.project_id)

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              {Object.values(errors).map((error, index) => (
                <p key={index} className="text-red-800 text-sm">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project *
        </label>
        <select
          value={formData.project_id}
          onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value, task_id: '' }))}
          className="input"
        >
          <option value="">Select a project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="text-red-600 text-xs mt-1">{errors.project_id}</p>
        )}
      </div>

      {/* Task Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task *
        </label>
        <select
          value={formData.task_id}
          onChange={(e) => setFormData(prev => ({ ...prev, task_id: e.target.value }))}
          className="input"
          disabled={!formData.project_id}
        >
          <option value="">Select a task</option>
          {filteredTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        {errors.task_id && (
          <p className="text-red-600 text-xs mt-1">{errors.task_id}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="input"
        />
      </div>

      {/* Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hours Spent *
        </label>
        <input
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          value={formData.hours}
          onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
          className="input"
          placeholder="2.5"
        />
        {errors.hours && (
          <p className="text-red-600 text-xs mt-1">{errors.hours}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="input"
          placeholder="What did you work on?"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : (timeLog ? 'Update' : 'Save')}
        </button>
      </div>
    </form>
  )
}

export default TimeTracking 