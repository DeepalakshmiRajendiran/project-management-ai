import React, { useState, useEffect } from 'react'
import { X, UserPlus, Search, AlertCircle, Save } from 'lucide-react'
import { teamAPI } from '../services/api'

const AssignTaskModal = ({ isOpen, onClose, onAssign, task }) => {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      if (task?.assigned_to) {
        setSelectedUserId(task.assigned_to)
      }
    }
  }, [isOpen, task])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await teamAPI.getUsers()
      console.log('Users response:', response)
      
      const usersData = response.data?.data || response.data || []
      console.log('Users data:', usersData)
      
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      } else {
        console.error('Users data is not an array:', usersData)
        setUsers([])
        setError('Invalid data format received')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setError('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedUserId) {
      setError('Please select a user to assign the task to')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onAssign(task.id, selectedUserId)
      handleClose()
    } catch (error) {
      console.error('Failed to assign task:', error)
      setError('Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUserId('')
    setSearchTerm('')
    setError('')
    onClose()
  }

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'project_manager':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      case 'designer':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Task</h3>
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
                {task.assigned_user && (
                  <p className="text-sm text-gray-500 mt-1">
                    Currently assigned to: {task.assigned_user.first_name} {task.assigned_user.last_name}
                  </p>
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

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">No users found</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedUserId === user.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedUser"
                          value={user.id}
                          checked={selectedUserId === user.id}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <span className={`priority-badge ${getRoleColor(user.role)}`}>
                            {user.role || 'member'}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Unassign Option */}
              <div className="border-t pt-4">
                <label className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors border-gray-200 hover:border-gray-300">
                  <input
                    type="radio"
                    name="selectedUser"
                    value=""
                    checked={selectedUserId === ''}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">U</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Unassign Task</p>
                      <p className="text-xs text-gray-500">Remove current assignment</p>
                    </div>
                  </div>
                </label>
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
                <UserPlus className="h-4 w-4" />
              )}
              <span>{loading ? 'Assigning...' : 'Assign Task'}</span>
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

export default AssignTaskModal 