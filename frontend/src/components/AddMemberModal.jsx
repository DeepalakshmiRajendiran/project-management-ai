import React, { useState, useEffect } from 'react'
import { X, UserPlus, Mail, Phone, AlertCircle, Save, Search } from 'lucide-react'
import { teamAPI } from '../services/api'

const AddMemberModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    role: 'member'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [existingUsers, setExistingUsers] = useState([])

  useEffect(() => {
    if (isOpen) {
      loadExistingUsers()
    }
  }, [isOpen])

  const loadExistingUsers = async () => {
    try {
      console.log('Loading existing users...')
      console.log('Auth token exists:', !!localStorage.getItem('authToken'))
      console.log('Auth token:', localStorage.getItem('authToken'))
      
      const response = await teamAPI.getUsers()
      console.log('Existing users response:', response)
      console.log('Response type:', typeof response)
      console.log('Response.data type:', typeof response.data)
      console.log('Response.data:', response.data)
      
      // Try different possible structures for the users array
      let users = []
      
      // Check if response.data is directly an array
      if (Array.isArray(response.data)) {
        users = response.data
        console.log('Found users directly in response.data')
      }
      // Check if response.data.data is an array (nested structure)
      else if (response.data?.data && Array.isArray(response.data.data)) {
        users = response.data.data
        console.log('Found users in response.data.data')
      }
      // Check if response.data.users is an array
      else if (response.data?.users && Array.isArray(response.data.users)) {
        users = response.data.users
        console.log('Found users in response.data.users')
      }
      // Check if response.data has a data property that's an object with users
      else if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        users = response.data.data.users
        console.log('Found users in response.data.data.users')
      }
      else {
        console.log('No users array found in response, using empty array')
        users = []
      }
      
      console.log('Final users variable:', users)
      console.log('Users is array:', Array.isArray(users))
      
      // Ensure users is always an array
      if (Array.isArray(users)) {
        console.log('Setting existing users:', users.length, 'users')
        console.log('Users from API:', users.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, is_active: u.is_active })))
        setExistingUsers(users)
      } else {
        console.error('Users data is not an array:', users)
        setExistingUsers([])
      }
    } catch (error) {
      console.error('Failed to load existing users:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.response?.data?.message)
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        console.error('Authentication error - user may not be logged in')
      } else if (error.response?.status === 404) {
        console.error('Route not found - API endpoint may not exist')
      }
      
      setExistingUsers([])
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate that we have a selected user
    if (!formData.id) {
      newErrors.user = 'Please select a team member'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('handleSubmit called')
    console.log('formData:', formData)
    console.log('formData.id:', formData.id)
    
    if (!validateForm()) {
      console.log('Validation failed')
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors
    
    try {
      const memberData = {
        user_id: formData.id,
        role: formData.role || 'member'
      }
      
      console.log('Sending member data:', memberData)
      await onSave(memberData)
      handleClose()
    } catch (error) {
      console.error('Failed to add member:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to add member to project'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Set error in the form
      setErrors({
        submit: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      phone: '',
      role: 'member'
    })
    setErrors({})
    setSearchTerm('')
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleExistingUserSelect = (user) => {
    console.log('handleExistingUserSelect called with user:', user)
    console.log('user.id:', user.id)
    
    const newFormData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      role: 'member'
    }
    
    console.log('Setting formData to:', newFormData)
    setFormData(newFormData)
    setErrors({}) // Clear any previous errors
  }

  const filteredExistingUsers = Array.isArray(existingUsers) ? existingUsers.filter(user => {
    // Only show active users
    if (!user.is_active) {
      return false
    }
    
    // Apply search filter
    const searchLower = searchTerm.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    )
  }) : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Team Member</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Select a team member to add to this project. Only active users are shown.
            </p>

            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    {errors.submit ? (
                      <p className="text-red-800 font-medium">{errors.submit}</p>
                    ) : (
                      <p className="text-red-800">Please fix the errors below</p>
                    )}
                    {errors.user && (
                      <p className="text-red-600 text-sm mt-1">{errors.user}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search Users */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Team Members
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                    placeholder="Search by name, email, or username"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {existingUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">Unable to load team members</p>
                    <p className="text-sm text-gray-400">Please check your connection and try again</p>
                  </div>
                ) : filteredExistingUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No team members found</p>
                ) : (
                  filteredExistingUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleExistingUserSelect(user)}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        formData.id === user.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                        <UserPlus className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Role selection */}
              {formData.id && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role in Project
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="input w-full"
                  >
                    <option value="member">Member</option>
                    <option value="developer">Developer</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="viewer">Viewer</option>
           
                  </select>
                </div>
              )}
            </div>
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
                 <UserPlus className="h-4 w-4" />
               )}
               <span>{loading ? 'Adding...' : 'Add Member'}</span>
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

export default AddMemberModal 