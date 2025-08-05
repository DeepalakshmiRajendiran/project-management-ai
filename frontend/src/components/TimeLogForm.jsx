import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  FileText, 
  Save, 
  X, 
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

const TimeLogForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  timeLog = null, 
  task = null,
  projects = [],
  tasks = []
}) => {
  const [formData, setFormData] = useState({
    hours: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    task_id: '',
    project_id: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [filteredTasks, setFilteredTasks] = useState([])

  useEffect(() => {
    if (timeLog && isOpen) {
      // Editing existing time log
      const hours = Math.floor(timeLog.duration / 60)
      const minutes = timeLog.duration % 60
      const totalHours = hours + (minutes / 60)
      setFormData({
        hours: totalHours.toFixed(2),
        date: format(new Date(timeLog.logged_at), 'yyyy-MM-dd'),
        description: timeLog.description || '',
        task_id: timeLog.task_id || '',
        project_id: timeLog.project_id || ''
      })
    } else if (task && isOpen) {
      // Creating new time log for specific task
      setFormData(prev => ({
        ...prev,
        task_id: task.id,
        project_id: task.project_id
      }))
    } else {
      // Reset form for new entry
      setFormData({
        hours: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        task_id: '',
        project_id: ''
      })
    }
  }, [timeLog, task, isOpen])

  // Filter tasks based on selected project
  useEffect(() => {
    if (formData.project_id) {
      const filtered = tasks.filter(task => task.project_id === formData.project_id)
      setFilteredTasks(filtered)
      // Clear task selection if current task doesn't belong to selected project
      if (formData.task_id && !filtered.find(t => t.id === formData.task_id)) {
        setFormData(prev => ({ ...prev, task_id: '' }))
      }
    } else {
      setFilteredTasks([])
      setFormData(prev => ({ ...prev, task_id: '' }))
    }
  }, [formData.project_id, tasks])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours spent must be greater than 0'
    }
    
    if (parseFloat(formData.hours) > 24) {
      newErrors.hours = 'Hours cannot exceed 24'
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required'
    }
    
    if (!formData.task_id) {
      newErrors.task_id = 'Task is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const hoursInMinutes = Math.round(parseFloat(formData.hours) * 60)

      const timeLogData = {
        duration: hoursInMinutes,
        description: formData.description,
        logged_at: new Date(formData.date).toISOString(),
        task_id: formData.task_id,
        project_id: formData.project_id
      }

      await onSave(timeLogData)
      handleClose()
    } catch (error) {
      console.error('Failed to save time log:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      hours: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      task_id: '',
      project_id: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {timeLog ? 'Edit Time Log' : 'Log Time'}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

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
                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                className="input"
                disabled={task} // Disable if task is pre-selected
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
                disabled={task} // Disable if task is pre-selected
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
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input pl-10"
                />
              </div>
              {errors.date && (
                <p className="text-red-600 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            {/* Hours Spent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours Spent *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                  className="input pl-10"
                  placeholder="2.5"
                />
              </div>
              {errors.hours && (
                <p className="text-red-600 text-xs mt-1">{errors.hours}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="input pl-10"
                  placeholder="What did you work on?"
                />
              </div>
            </div>
          </form>

          <div className="bg-gray-50 px-6 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : 'Save Time Log'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary mr-3"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeLogForm 