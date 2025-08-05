import React, { useState, useEffect } from 'react'
import { 
  X, 
  MessageSquare, 
  Clock, 
  Paperclip, 
  Send, 
  Plus, 
  CheckCircle, 
  Circle,
  Edit,
  Trash2,
  Download,
  Eye,
  Activity,
  Calendar,
  User,
  AlertCircle,
  Save,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'

const TaskDetailModal = ({ isOpen, onClose, task, onUpdate, onCommentAdd, onTimeLogAdd }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')

  const [editingDescription, setEditingDescription] = useState(false)
  const [description, setDescription] = useState('')
  const [timeLogForm, setTimeLogForm] = useState({
    hours: '',
    minutes: '',
    description: ''
  })
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task && isOpen) {
      setDescription(task.description || '')
      setAttachments(task.attachments || [])
    }
  }, [task, isOpen])

  const handleClose = () => {
    setActiveTab('overview')
    setNewComment('')
    setEditingDescription(false)
    setTimeLogForm({ hours: '', minutes: '', description: '' })
    setError('')
    onClose()
  }

  const handleDescriptionSave = async () => {
    try {
      setLoading(true)
      await onUpdate(task.id, { description })
      setEditingDescription(false)
    } catch (error) {
      console.error('Failed to update description:', error)
      setError('Failed to update description')
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setLoading(true)
      console.log('Submitting comment for task:', task.id, 'content:', newComment)
      await onCommentAdd(task.id, {
        content: newComment,
        attachments: attachments
      })
      console.log('Comment submitted successfully')
      setNewComment('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to add comment:', error)
      setError('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }



  const handleTimeLogSubmit = async (e) => {
    e.preventDefault()
    if (!timeLogForm.hours && !timeLogForm.minutes) return
    if (!timeLogForm.description || !timeLogForm.description.trim()) {
      setError('Description is required')
      return
    }

    try {
      setLoading(true)
      setError('') // Clear any previous errors
      const totalMinutes = (parseInt(timeLogForm.hours) || 0) * 60 + (parseInt(timeLogForm.minutes) || 0)
      console.log('Submitting time log for task:', task.id, 'data:', {
        duration: totalMinutes,
        description: timeLogForm.description,
        logged_at: new Date().toISOString()
      })
      await onTimeLogAdd(task.id, {
        duration: totalMinutes,
        description: timeLogForm.description
      })
      console.log('Time log submitted successfully')
      setTimeLogForm({ hours: '', minutes: '', description: '' })
      setError('') // Ensure error is cleared on success
    } catch (error) {
      console.error('Failed to add time log:', error)
      setError('Failed to add time log')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes) => {
    const mins = parseFloat(minutes) || 0
    const hours = Math.floor(mins / 60)
    const remainingMins = Math.round(mins % 60)
    return `${hours}h ${remainingMins}m`
  }

  const getTotalTimeLogged = () => {
    return (task.time_logs || []).reduce((total, log) => total + (parseFloat(log.hours_spent) || 0), 0)
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

  console.log('TaskDetailModal render - isOpen:', isOpen, 'task:', task)
  console.log('Task comments:', task?.comments)
  console.log('Task comments type:', typeof task?.comments)
  console.log('Task comments is array:', Array.isArray(task?.comments))
  console.log('Task time logs:', task?.time_logs)
  console.log('Task time logs type:', typeof task?.time_logs)
  console.log('Task time logs is array:', Array.isArray(task?.time_logs))
  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getStatusColor(task.status)}`}>
                  {task.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`status-badge ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'comments', label: 'Comments', icon: MessageSquare },
                { id: 'time', label: 'Time Logs', icon: Clock },
                { id: 'activity', label: 'Activity', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    {!editingDescription && (
                      <button
                        onClick={() => setEditingDescription(true)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="input w-full"
                        placeholder="Enter task description..."
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDescriptionSave}
                          disabled={loading}
                          className="btn btn-primary btn-sm"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingDescription(false)
                            setDescription(task.description || '')
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      {description ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                      ) : (
                        <p className="text-gray-500 italic">No description provided</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      {task.due_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Due: {(() => {
                              try {
                                const date = new Date(task.due_date)
                                return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, yyyy')
                              } catch (error) {
                                return 'Invalid date'
                              }
                            })()}
                          </span>
                        </div>
                      )}
                      
                      {task.assigned_user && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {task.assigned_user.first_name} {task.assigned_user.last_name}
                          </span>
                        </div>
                      )}
                      
                      {task.estimated_hours && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Estimated: {task.estimated_hours}h
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Progress</h4>
                    <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{calculateTimeBasedProgress()}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary-500"
                            style={{ width: `${calculateTimeBasedProgress()}%` }}
                            />
                        </div>
                        {task.total_time_spent > 0 && task.estimated_hours > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {task.total_time_spent}h / {task.estimated_hours}h logged
                          </div>
                        )}
                        </div>
                      
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Logged</span>
                          <span className="font-medium">
                            {formatDuration(getTotalTimeLogged())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Add Comment */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="input w-full"
                  />
                  
                  {/* File Attachments */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Attachments</h5>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700 flex-1">{attachment.name}</span>
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                        <Paperclip className="h-4 w-4" />
                        <span>Attach files</span>
                      </div>
                    </label>
                    
                    <button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      className="btn btn-primary btn-sm flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Comment</span>
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {console.log('Rendering comments section, task.comments:', task.comments)}
                  {Array.isArray(task.comments) ? task.comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {comment.user?.first_name?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.user?.first_name} {comment.user?.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                try {
                                  const date = new Date(comment.created_at)
                                  return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, yyyy HH:mm')
                                } catch (error) {
                                  return 'Invalid date'
                                }
                              })()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          
                          {/* Comment Attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="space-y-1">
                              {comment.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                  <Paperclip className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{attachment.name}</span>
                                  <button className="text-primary-600 hover:text-primary-800">
                                    <Download className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : null}
                  
                  {console.log('Checking empty state, task.comments:', task.comments, 'isArray:', Array.isArray(task.comments), 'length:', task.comments?.length)}
                  {(!Array.isArray(task.comments) || task.comments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Time Logs Tab */}
            {activeTab === 'time' && (
              <div className="space-y-4">
                {/* Add Time Log */}
                <form onSubmit={handleTimeLogSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">Log Time</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={timeLogForm.hours}
                        onChange={(e) => setTimeLogForm(prev => ({ ...prev, hours: e.target.value }))}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timeLogForm.minutes}
                        onChange={(e) => setTimeLogForm(prev => ({ ...prev, minutes: e.target.value }))}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={loading || (!timeLogForm.hours && !timeLogForm.minutes) || !timeLogForm.description?.trim()}
                        className="btn btn-primary btn-sm w-full"
                      >
                        {loading ? 'Logging...' : 'Log Time'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={timeLogForm.description}
                    onChange={(e) => setTimeLogForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className="input"
                  />
                </form>

                {/* Time Logs Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{getTotalTimeLogged().toFixed(1)}h</p>
                      <p className="text-xs text-blue-600">Total Time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{task.time_logs?.length || 0}</p>
                      <p className="text-xs text-blue-600">Time Entries</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {task.estimated_hours ? `${task.estimated_hours}h` : 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600">Estimated</p>
                    </div>
                  </div>
                </div>

                {/* Time Logs List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Time Entries</h4>
                  {console.log('Rendering time logs section, task.time_logs:', task.time_logs)}
                  {(task.time_logs || []).map((log) => {
                    console.log('Time log data:', log)
                    return (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                              {parseFloat(log.hours_spent).toFixed(1)}h
                          </p>
                          {log.description && (
                            <p className="text-xs text-gray-600">{log.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                          {(() => {
                            try {
                              const date = new Date(log.created_at)
                              return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, HH:mm')
                            } catch (error) {
                              return 'Invalid date'
                            }
                          })()}
                      </span>
                    </div>
                    )
                  })}
                  
                  {console.log('Checking time logs empty state, task.time_logs:', task.time_logs, 'isArray:', Array.isArray(task.time_logs), 'length:', task.time_logs?.length)}
                  {(!task.time_logs || task.time_logs.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No time logs yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Activity History</h4>
                <div className="space-y-3">
                  {(task.activity_logs || []).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {activity.user?.first_name} {activity.user?.last_name}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const date = new Date(activity.created_at)
                                return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, yyyy HH:mm')
                              } catch (error) {
                                return 'Invalid date'
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!task.activity_logs || task.activity_logs.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal 