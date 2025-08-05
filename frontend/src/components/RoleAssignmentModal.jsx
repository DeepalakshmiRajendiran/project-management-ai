import React, { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Shield, 
  FolderOpen, 
  Save,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

const RoleAssignmentModal = ({ isOpen, onClose, user, projects, onAssign }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    role: 'member',
    permissions: []
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && projects.length > 0) {
      setFormData(prev => ({
        ...prev,
        project_id: projects[0]?.id || ''
      }))
    }
  }, [user, projects])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required'
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onAssign(user.id, formData.project_id, formData)
      handleClose()
    } catch (error) {
      console.error('Failed to assign role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      project_id: '',
      role: 'member',
      permissions: []
    })
    setErrors({})
    setLoading(false)
    onClose()
  }

  const getRoleColor = (role) => {
    switch (role) {

      case 'project_manager':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-purple-100 text-purple-800'
      case 'viewer':
        return 'bg-orange-100 text-orange-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {

      case 'project_manager':
        return 'Project management, task assignment, and team coordination'
      case 'developer':
        return 'Technical development and task implementation'
      case 'viewer':
        return 'Read-only access to project information'
      case 'member':
        return 'Standard project member with basic access'
      default:
        return 'Standard project member with basic access'
    }
  }

  const getRolePermissions = (role) => {
    switch (role) {

      case 'project_manager':
        return [
          'View all project data',
          'Create and edit tasks',
          'Assign tasks to team members',
          'Update project progress',
          'Manage milestones',
          'View reports and analytics'
        ]
      case 'developer':
        return [
          'View assigned tasks',
          'Update task progress',
          'Add comments and attachments',
          'Log time spent',
          'Access development tools',
          'View project timeline'
        ]
      case 'viewer':
        return [
          'View project information',
          'View task lists',
          'View project timeline',
          'Read-only access to all data'
        ]
      case 'member':
        return [
          'View assigned tasks',
          'Update task progress',
          'Add comments and attachments',
          'Log time spent',
          'View project timeline',
          'Access development tools'
        ]
      default:
        return []
    }
  }

  const getCurrentUserRole = (projectId) => {
    if (!user || !projectId) return null
    
    const project = projects.find(p => p.id === projectId)
    if (!project || !project.team) return null
    
    const teamMember = project.team.find(member => member.user_id === user.id)
    return teamMember?.project_role || null
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Assign Role to {user.first_name} {user.last_name}
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

            {/* User Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">Current Role: {user.role}</p>
              </div>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                  className="input pl-10"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.project_id && (
                <p className="text-red-600 text-xs mt-1">{errors.project_id}</p>
              )}
            </div>

            {/* Current Role in Selected Project */}
            {formData.project_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">Current Project Role</span>
                </div>
                {getCurrentUserRole(formData.project_id) ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`priority-badge ${getRoleColor(getCurrentUserRole(formData.project_id))}`}>
                      {getCurrentUserRole(formData.project_id)}
                    </span>
                    <span className="text-sm text-blue-700">(Will be updated)</span>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700 mt-2">Not assigned to this project yet</p>
                )}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="input"
              >
                <option value="member">Member</option>
                <option value="developer">Developer</option>
                <option value="project_manager">Project Manager</option>
                <option value="viewer">Viewer</option>
       
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getRoleDescription(formData.role)}
              </p>
              {errors.role && (
                <p className="text-red-600 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            {/* Role Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Permissions
              </label>
              <div className="space-y-2">
                {getRolePermissions(formData.role).map((permission, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning for Admin Role */}
            {formData.role === 'admin' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-800">Administrator Access</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This role grants full access to the project including user management and settings. 
                  Use with caution.
                </p>
              </div>
            )}
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
              <span>{loading ? 'Assigning...' : 'Assign Role'}</span>
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

export default RoleAssignmentModal 