import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import AssignTaskModal from './AssignTaskModal'
import TaskProgress from './TaskProgress'
import TaskDetailModal from './TaskDetailModal'
import { commentsAPI, timeAPI } from '../services/api'

const TaskList = ({ 
  tasks = [], 
  projectId, 
  onTaskUpdate, 
  onTaskCreate,
  onTaskDelete, 
  onTaskAssign,
  onTaskProgressUpdate 
}) => {
  console.log('TaskList received tasks:', tasks)
  console.log('TaskList tasks length:', tasks.length)
  const [filteredTasks, setFilteredTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('due_date')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filter and sort tasks
  useEffect(() => {
    console.log('TaskList useEffect - filtering tasks:', tasks)
    let filtered = [...tasks]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigned_to === assigneeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          break
        case 'due_date':
          aValue = new Date(a.due_date || '9999-12-31')
          bValue = new Date(b.due_date || '9999-12-31')
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority] || 0
          bValue = priorityOrder[b.priority] || 0
          break
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, review: 3, completed: 4 }
          aValue = statusOrder[a.status] || 0
          bValue = statusOrder[b.status] || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at || '1970-01-01')
          bValue = new Date(b.created_at || '1970-01-01')
          break
        default:
          aValue = a[sortBy] || ''
          bValue = b[sortBy] || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    console.log('TaskList filtered tasks:', filtered)
    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder])

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      setLoading(true)
      console.log('handleTaskUpdate called with taskId:', taskId, 'updates:', updates)
      
      if (taskId) {
        // Update existing task
        console.log('Updating existing task')
        await onTaskUpdate(taskId, updates)
      } else {
        // Create new task
        console.log('Creating new task')
        if (onTaskCreate) {
          await onTaskCreate(updates)
        } else {
          console.error('onTaskCreate function is required for creating new tasks')
          return
        }
      }
      
      console.log('Task operation completed, closing modal')
      setShowTaskModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Failed to update/create task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setLoading(true)
        await onTaskDelete(taskId)
      } catch (error) {
        console.error('Failed to delete task:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTaskAssign = async (taskId, userId) => {
    try {
      setLoading(true)
      await onTaskAssign(taskId, userId)
      setShowAssignModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Failed to assign task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProgressUpdate = async (taskId, progress, status) => {
    try {
      setLoading(true)
      await onTaskProgressUpdate(taskId, progress, status)
      setShowProgressModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Failed to update task progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (task) => {
    try {
      // Fetch comments and time logs for this task
      const [commentsResponse, timeLogsResponse] = await Promise.all([
        commentsAPI.getByTask(task.id),
        timeAPI.getByTask(task.id)
      ])
      
      console.log('Comments API response:', commentsResponse)
      console.log('Time logs API response:', timeLogsResponse)
      
      // The API returns { success: true, data: commentsArray }
      const comments = commentsResponse.data?.data || commentsResponse.data || []
      const timeLogs = timeLogsResponse.data?.data || timeLogsResponse.data || []
      
      console.log('Extracted comments:', comments)
      console.log('Extracted time logs:', timeLogs)
      
      const taskWithData = {
        ...task,
        comments: Array.isArray(comments) ? comments : [],
        time_logs: Array.isArray(timeLogs) ? timeLogs : []
      }
      console.log('Task with data:', taskWithData)
      setSelectedTask(taskWithData)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Failed to fetch task data:', error)
      // Still show the modal with the original task data
      setSelectedTask(task)
      setShowDetailModal(true)
    }
  }

  const handleCommentAdd = async (taskId, commentData) => {
    try {
      const response = await commentsAPI.create({
        content: commentData.content,
        task_id: taskId,
        attachments: commentData.attachments || []
      })
      
      // Refresh comments for the selected task
      if (selectedTask && selectedTask.id === taskId) {
        try {
          const commentsResponse = await commentsAPI.getByTask(taskId)
          console.log('Comment refresh response:', commentsResponse)
          
          // The API returns { success: true, data: commentsArray }
          const comments = commentsResponse.data?.data || commentsResponse.data || []
          console.log('Refreshed comments:', comments)
          
          const updatedTask = {
            ...selectedTask,
            comments: Array.isArray(comments) ? comments : []
          }
          console.log('Updated task with comments:', updatedTask)
          setSelectedTask(updatedTask)
        } catch (error) {
          console.error('Failed to refresh comments:', error)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to add comment:', error)
      throw error
    }
  }



  const handleTimeLogAdd = async (taskId, timeLogData) => {
    try {
      console.log('Creating time log for task:', taskId, 'data:', timeLogData)
      const response = await timeAPI.create({
        task_id: taskId,
        hours_spent: timeLogData.duration / 60, // Convert minutes to hours
        description: timeLogData.description,
        date: new Date().toISOString().split('T')[0]
      })
      
      console.log('Time log creation response:', response)
      
      // Refresh time logs for the selected task
      if (selectedTask && selectedTask.id === taskId) {
        try {
          const timeLogsResponse = await timeAPI.getByTask(taskId)
          console.log('Time logs refresh response:', timeLogsResponse)
          
          // The API returns { success: true, data: timeLogsArray }
          const timeLogs = timeLogsResponse.data?.data || timeLogsResponse.data || []
          console.log('Refreshed time logs:', timeLogs)
          
          const updatedTask = {
            ...selectedTask,
            time_logs: Array.isArray(timeLogs) ? timeLogs : []
          }
          console.log('Updated task with time logs:', updatedTask)
          setSelectedTask(updatedTask)
        } catch (error) {
          console.error('Failed to refresh time logs:', error)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to add time log:', error)
      throw error
    }
  }

  const getStatusStats = () => {
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        if (t.status === 'completed') return false
        if (!t.due_date) return false
        return new Date(t.due_date) < new Date()
      }).length
    }
    return stats
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-600">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null)
            setShowTaskModal(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-sm font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="h-3 w-3 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Todo</p>
              <p className="text-sm font-bold text-gray-900">{stats.todo}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">In Progress</p>
              <p className="text-sm font-bold text-blue-600">{stats.in_progress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Review</p>
              <p className="text-sm font-bold text-yellow-600">{stats.review}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Completed</p>
              <p className="text-sm font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Overdue</p>
              <p className="text-sm font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Assignee</option>
              {/* Add assignee options here */}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="due_date">Due Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="created_at">Created</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              {viewMode === 'list' ? 'Grid' : 'List'}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span className="text-gray-600 text-sm">Loading tasks...</span>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-sm text-gray-600">
              {tasks.length === 0 ? 'No tasks have been created yet.' : 'No tasks match your filters.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3' : 'divide-y'}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                viewMode={viewMode}
                onEdit={() => {
                  setSelectedTask(task)
                  setShowTaskModal(true)
                }}
                onDelete={() => handleTaskDelete(task.id)}
                onAssign={() => {
                  setSelectedTask(task)
                  setShowAssignModal(true)
                }}
                onProgressUpdate={() => {
                  setSelectedTask(task)
                  setShowProgressModal(true)
                }}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
          onSave={handleTaskUpdate}
          task={selectedTask}
          projectId={projectId}
        />
      )}

      {showAssignModal && (
        <AssignTaskModal
          onClose={() => {
            setShowAssignModal(false)
            setSelectedTask(null)
          }}
          onAssign={handleTaskAssign}
          task={selectedTask}
        />
      )}

      {showProgressModal && (
        <TaskProgress
          onClose={() => {
            setShowProgressModal(false)
            setSelectedTask(null)
          }}
          onUpdate={handleProgressUpdate}
          task={selectedTask}
        />
      )}

      {showDetailModal && (
        <TaskDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedTask(null)
          }}
          task={selectedTask}
          onUpdate={handleTaskUpdate}
          onCommentAdd={handleCommentAdd}

          onTimeLogAdd={handleTimeLogAdd}
        />
      )}
    </div>
  )
}

export default TaskList 