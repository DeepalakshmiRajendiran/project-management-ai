import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  Filter, 
  Download, 
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import TimeLogForm from './TimeLogForm'

const Timesheet = ({ 
  timeLogs = [], 
  users = [], 
  projects = [], 
  tasks = [],
  onTimeLogAdd,
  onTimeLogUpdate,
  onTimeLogDelete
}) => {
  const [filteredLogs, setFilteredLogs] = useState([])
  const [filters, setFilters] = useState({
    user: '',
    project: '',
    task: '',
    dateRange: 'week',
    category: '',
    billable: 'all'
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar', 'summary'
  const [showTimeLogForm, setShowTimeLogForm] = useState(false)
  const [selectedTimeLog, setSelectedTimeLog] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    applyFilters()
  }, [timeLogs, filters, selectedDate, searchTerm])

  const applyFilters = () => {
    let filtered = [...timeLogs]

    // Date range filter
    const startDate = getStartDate()
    const endDate = getEndDate()
    filtered = filtered.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate >= startDate && logDate <= endDate
    })

    // User filter
    if (filters.user) {
      filtered = filtered.filter(log => log.user_id === filters.user)
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(log => log.project_id === filters.project)
    }

    // Task filter
    if (filters.task) {
      filtered = filtered.filter(log => log.task_id === filters.task)
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category)
    }

    // Billable filter
    if (filters.billable !== 'all') {
      const isBillable = filters.billable === 'billable'
      filtered = filtered.filter(log => log.billable === isBillable)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const getStartDate = () => {
    switch (filters.dateRange) {
      case 'today':
        return new Date(selectedDate.setHours(0, 0, 0, 0))
      case 'week':
        return startOfWeek(selectedDate, { weekStartsOn: 1 })
      case 'month':
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      case 'custom':
        return new Date(filters.startDate)
      default:
        return startOfWeek(selectedDate, { weekStartsOn: 1 })
    }
  }

  const getEndDate = () => {
    switch (filters.dateRange) {
      case 'today':
        return new Date(selectedDate.setHours(23, 59, 59, 999))
      case 'week':
        return endOfWeek(selectedDate, { weekStartsOn: 1 })
      case 'month':
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      case 'custom':
        return new Date(filters.endDate)
      default:
        return endOfWeek(selectedDate, { weekStartsOn: 1 })
    }
  }

  const getTotalHours = () => {
    return filteredLogs.reduce((total, log) => total + (log.duration || 0), 0) / 60
  }

  const getBillableHours = () => {
    return filteredLogs
      .filter(log => log.billable)
      .reduce((total, log) => total + (log.duration || 0), 0) / 60
  }

  const getCategoryBreakdown = () => {
    const breakdown = {}
    filteredLogs.forEach(log => {
      const category = log.category || 'other'
      breakdown[category] = (breakdown[category] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const getUserBreakdown = () => {
    const breakdown = {}
    filteredLogs.forEach(log => {
      const userId = log.user_id
      breakdown[userId] = (breakdown[userId] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const getProjectBreakdown = () => {
    const breakdown = {}
    filteredLogs.forEach(log => {
      const projectId = log.project_id
      breakdown[projectId] = (breakdown[projectId] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'development': return 'bg-blue-100 text-blue-800'
      case 'design': return 'bg-purple-100 text-purple-800'
      case 'testing': return 'bg-green-100 text-green-800'
      case 'meeting': return 'bg-yellow-100 text-yellow-800'
      case 'research': return 'bg-orange-100 text-orange-800'
      case 'documentation': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTimeLogSave = async (timeLogData) => {
    try {
      if (selectedTimeLog) {
        await onTimeLogUpdate(selectedTimeLog.id, timeLogData)
      } else {
        await onTimeLogAdd(timeLogData)
      }
      setShowTimeLogForm(false)
      setSelectedTimeLog(null)
    } catch (error) {
      console.error('Failed to save time log:', error)
    }
  }

  const handleTimeLogDelete = async (timeLogId) => {
    if (window.confirm('Are you sure you want to delete this time log?')) {
      try {
        await onTimeLogDelete(timeLogId)
      } catch (error) {
        console.error('Failed to delete time log:', error)
      }
    }
  }

  const exportTimesheet = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheet-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Task', 'Category', 'Duration', 'Description', 'Billable']
    const rows = filteredLogs.map(log => [
      format(new Date(log.logged_at), 'yyyy-MM-dd'),
      users.find(u => u.id === log.user_id)?.first_name + ' ' + users.find(u => u.id === log.user_id)?.last_name,
      projects.find(p => p.id === log.project_id)?.name,
      tasks.find(t => t.id === log.task_id)?.title,
      log.category,
      formatDuration(log.duration),
      log.description,
      log.billable ? 'Yes' : 'No'
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const categoryBreakdown = getCategoryBreakdown()
  const userBreakdown = getUserBreakdown()
  const projectBreakdown = getProjectBreakdown()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Timesheet</h2>
          <p className="text-gray-600">
            {formatDuration(getTotalHours() * 60)} logged • {formatDuration(getBillableHours() * 60)} billable
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportTimesheet}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setSelectedTimeLog(null)
              setShowTimeLogForm(true)
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Log Time</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="input"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.user}
              onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
              className="input"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="input"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="testing">Testing</option>
              <option value="meeting">Meeting</option>
              <option value="research">Research</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>

          {/* Billable Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billable</label>
            <select
              value={filters.billable}
              onChange={(e) => setFilters(prev => ({ ...prev, billable: e.target.value }))}
              className="input"
            >
              <option value="all">All Time</option>
              <option value="billable">Billable Only</option>
              <option value="non-billable">Non-Billable Only</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search time logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-lg font-bold text-gray-900">{getTotalHours().toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Billable Hours</p>
              <p className="text-lg font-bold text-green-600">{getBillableHours().toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-bold text-purple-600">{Object.keys(userBreakdown).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-lg font-bold text-orange-600">{Object.keys(projectBreakdown).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center space-x-4 border-b">
        <button
          onClick={() => setViewMode('list')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            viewMode === 'list'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            viewMode === 'calendar'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setViewMode('summary')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            viewMode === 'summary'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Summary
        </button>
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.logged_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {users.find(u => u.id === log.user_id)?.first_name} {users.find(u => u.id === log.user_id)?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {projects.find(p => p.id === log.project_id)?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tasks.find(t => t.id === log.task_id)?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`priority-badge ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(log.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.billable ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTimeLog(log)
                          setShowTimeLogForm(true)
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTimeLogDelete(log.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown).map(([category, minutes]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`priority-badge ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(minutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Breakdown */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(userBreakdown).map(([userId, minutes]) => {
                const user = users.find(u => u.id === userId)
                return (
                  <div key={userId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Time Log Form Modal */}
      <TimeLogForm
        isOpen={showTimeLogForm}
        onClose={() => {
          setShowTimeLogForm(false)
          setSelectedTimeLog(null)
        }}
        onSave={handleTimeLogSave}
        timeLog={selectedTimeLog}
        projects={projects}
        tasks={tasks}
      />
    </div>
  )
}

export default Timesheet 