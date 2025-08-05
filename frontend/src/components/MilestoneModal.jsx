import React, { useState, useEffect } from 'react'
import { X, Calendar, AlertCircle } from 'lucide-react'

const MilestoneModal = ({ milestone, projectId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: null,
    status: 'pending'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const isEditing = !!milestone

  useEffect(() => {
    if (milestone) {
      console.log('Milestone data received:', milestone);
      console.log('Original due_date:', milestone.due_date);
      
      let processedDueDate = null;
      if (milestone.due_date) {
        // Handle different date formats
        const originalDate = new Date(milestone.due_date);
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
        name: milestone.name || '',
        description: milestone.description || '',
        due_date: processedDueDate,
        status: milestone.status || 'pending'
      })
    }
  }, [milestone])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past'
      }
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
      const milestoneData = {
        ...formData,
        project_id: projectId
      }

      await onSave(milestone?.id, milestoneData)
    } catch (error) {
      console.error('Failed to save milestone:', error)
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
            {isEditing ? 'Edit Milestone' : 'Create New Milestone'}
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Milestone Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter milestone name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
              placeholder="Enter milestone description"
            />
          </div>

          {/* Status and Due Date */}
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
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

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
                isEditing ? 'Update Milestone' : 'Create Milestone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MilestoneModal 