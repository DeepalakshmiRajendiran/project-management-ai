import React, { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Building,
  Briefcase,
  Save,
  Edit,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

const UserProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    role: '',
    department: '',
    position: '',
    status: 'active'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        position: user.position || '',
        status: user.status || 'active'
      })
    }
  }, [user])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
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
      await onUpdate(user.id, formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setErrors({})
    setLoading(false)
    onClose()
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      case 'designer':
        return 'bg-purple-100 text-purple-800'
      case 'tester':
        return 'bg-yellow-100 text-yellow-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
                {isEditing ? 'Edit User Profile' : 'User Profile'}
              </h3>
              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary-600 hover:text-primary-800"
                    title="Edit Profile"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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

            {/* Profile Header */}
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <span className="text-primary-600 text-2xl font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </h4>
              <p className="text-sm text-gray-600">{user.email}</p>
              
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className={`priority-badge ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                <span className={`priority-badge ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.first_name}</p>
                  )}
                  {errors.first_name && (
                    <p className="text-red-600 text-xs mt-1">{errors.first_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.last_name}</p>
                  )}
                  {errors.last_name && (
                    <p className="text-red-600 text-xs mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input pl-10"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 pl-10">{user.email}</p>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{user.username}</p>
                )}
                {errors.username && (
                  <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input pl-10"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 pl-10">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Professional Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                {isEditing ? (
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="input"
                  >
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="manager">Manager</option>
                    <option value="tester">Tester</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Administrator</option>
                  </select>
                ) : (
                  <span className={`priority-badge ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                )}
                {errors.role && (
                  <p className="text-red-600 text-xs mt-1">{errors.role}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        className="input pl-10"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 pl-10">{user.department || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        className="input pl-10"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 pl-10">{user.position || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Account Information</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {user.updated_at ? format(new Date(user.updated_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {isEditing && (
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
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary mr-3"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal 