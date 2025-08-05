import React, { useState, useEffect } from 'react'
import { X, Calendar, User, AlertCircle } from 'lucide-react'
import { milestonesAPI, teamAPI } from '../services/api'

const TaskModal = ({ task, projectId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    estimated_hours: '',
    assigned_to: '',
    milestone_id: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState([])
  const [users, setUsers] = useState([])

  const isEditing = !!task

  useEffect(() => {
    if (task) {
      console.log('Task data received:', task);
      console.log('Original due_date:', task.due_date);
      
      let processedDueDate = null;
      if (task.due_date) {
        // Handle different date formats
        const originalDate = new Date(task.due_date);
        console.log('Parsed date:', originalDate);
        console.log('Date toISOString:', originalDate.toISOString());
        
        // Use local date formatting to avoid timezone issues
        const year = originalDate.getFullYear();
        const month = String(originalDate.getMonth() + 1).padStart(2, '0');
        const day = String(originalDate.getDate()).padStart(2, '0');
        processedDueDate = `${year}-${month}-${day}`;
        console.log('Processed due_date:', processedDueDate);
      }
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: processedDueDate,
        estimated_hours: task.estimated_hours || '',
        assigned_to: task.assigned_to || '',
        milestone_id: task.milestone_id || ''
      })
    }
    // Load milestones and users if projectId is provided
    if (projectId) {
      loadMilestones()
      loadUsers()
    }
  }, [task, projectId])

  const loadMilestones = async () => {
    try {
      console.log('Loading milestones for project:', projectId)
      const response = await milestonesAPI.getByProject(projectId)
      console.log('Milestones response:', response.data)
      setMilestones(response.data?.data || [])
    } catch (error) {
      console.error('Failed to load milestones:', error)
    }
  }

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const response = await teamAPI.getUsers()
      console.log('Users response:', response.data)
      setUsers(response.data?.data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('Date validation:', {
        dueDate: dueDate.toISOString(),
        today: today.toISOString(),
        dueDateValue: formData.due_date,
        isPast: dueDate < today
      });
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past'
      }
    }

    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours <= 0)) {
      newErrors.estimated_hours = 'Estimated hours must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const taskData = {
        ...formData,
        project_id: projectId,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        assigned_to: formData.assigned_to || null,
        milestone_id: formData.milestone_id || null
      }

      console.log('TaskModal submitting task data:', taskData)
      await onSave(task?.id, taskData)
      console.log('TaskModal save completed')
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`input ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="input"
              placeholder="Enter task description"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="input"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleChange('due_date', e.target.value || null)}
                  className={`input pl-10 ${errors.due_date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimated_hours"
                value={formData.estimated_hours}
                onChange={(e) => handleChange('estimated_hours', e.target.value)}
                className={`input ${errors.estimated_hours ? 'border-red-500' : ''}`}
                placeholder="e.g., 8"
                min="0"
                step="0.5"
              />
              {errors.estimated_hours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimated_hours}</p>
              )}
            </div>
          </div>

          {/* Assignment and Milestone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => handleChange('assigned_to', e.target.value)}
                  className="input pl-10"
                >
                  <option value="">Unassigned</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="milestone_id" className="block text-sm font-medium text-gray-700 mb-2">
                Milestone
              </label>
              <select
                id="milestone_id"
                value={formData.milestone_id}
                onChange={(e) => handleChange('milestone_id', e.target.value)}
                className="input"
              >
                <option value="">No Milestone</option>
                {Array.isArray(milestones) && milestones.map(milestone => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>



          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                isEditing ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal 