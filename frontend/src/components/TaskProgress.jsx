import React, { useState, useEffect } from 'react'
import { X, TrendingUp, AlertCircle, Save } from 'lucide-react'

const TaskProgress = ({ isOpen, onClose, onUpdate, task }) => {
  const [formData, setFormData] = useState({
    progress_percentage: 0,
    status: 'todo'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        progress_percentage: task.progress_percentage || 0,
        status: task.status || 'todo'
      })
    }
  }, [task, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!task) return

    setLoading(true)
    setError('')

    try {
      await onUpdate(task.id, formData.progress_percentage, formData.status)
      onClose()
    } catch (error) {
      console.error('Failed to update task progress:', error)
      setError('Failed to update task progress')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      progress_percentage: 0,
      status: 'todo'
    })
    setError('')
    onClose()
  }

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

  const calculateTimeBasedProgress = () => {
    if (!task) return 0
    
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Task Progress</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {task && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Time-based Progress Info */}
              {task && (task.total_time_spent > 0 || task.estimated_hours > 0) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Time-based Progress</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Time Logged:</span>
                      <span className="font-medium">{task.total_time_spent || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Estimated Hours:</span>
                      <span className="font-medium">{task.estimated_hours || 'Not set'}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Time-based Progress:</span>
                      <span className="font-medium">{calculateTimeBasedProgress()}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Progress: {formData.progress_percentage}%
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      progress_percentage: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Progress Bar Preview */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getProgressColor(formData.progress_percentage)}`}
                      style={{ width: `${formData.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'todo', label: 'Todo', icon: '⏳' },
                    { value: 'in_progress', label: 'In Progress', icon: '🔄' },
                    { value: 'review', label: 'Review', icon: '👀' },
                    { value: 'completed', label: 'Completed', icon: '✅' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.status === status.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{status.icon}</span>
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Actions
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, progress_percentage: 25, status: 'in_progress' }))}
                    className="btn btn-secondary text-xs"
                  >
                    Start (25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, progress_percentage: 50, status: 'in_progress' }))}
                    className="btn btn-secondary text-xs"
                  >
                    Halfway (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, progress_percentage: 75, status: 'review' }))}
                    className="btn btn-secondary text-xs"
                  >
                    Review (75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, progress_percentage: 100, status: 'completed' }))}
                    className="btn btn-secondary text-xs"
                  >
                    Complete (100%)
                  </button>
                  {task && task.total_time_spent > 0 && task.estimated_hours > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        progress_percentage: calculateTimeBasedProgress(),
                        status: calculateTimeBasedProgress() >= 100 ? 'completed' : 'in_progress'
                      }))}
                      className="btn btn-primary text-xs"
                    >
                      Sync with Time ({calculateTimeBasedProgress()}%)
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
              <span>{loading ? 'Updating...' : 'Update Progress'}</span>
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

export default TaskProgress 