import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  User, 
  AlertCircle,
  Download,
  Filter
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

const TimeSummary = ({ 
  timeLogs = [], 
  users = [], 
  projects = [], 
  tasks = []
}) => {
  const [dateRange, setDateRange] = useState('week')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [viewMode, setViewMode] = useState('overview') // 'overview', 'user', 'project', 'trends'

  const getFilteredLogs = () => {
    let filtered = [...timeLogs]

    // Date range filter
    const startDate = getStartDate()
    const endDate = getEndDate()
    filtered = filtered.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate >= startDate && logDate <= endDate
    })

    // User filter
    if (selectedUser) {
      filtered = filtered.filter(log => log.user_id === selectedUser)
    }

    // Project filter
    if (selectedProject) {
      filtered = filtered.filter(log => log.project_id === selectedProject)
    }

    return filtered
  }

  const getStartDate = () => {
    switch (dateRange) {
      case 'week':
        return startOfWeek(new Date(), { weekStartsOn: 1 })
      case 'month':
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(new Date().getMonth() / 3)
        return new Date(new Date().getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(new Date().getFullYear(), 0, 1)
      default:
        return startOfWeek(new Date(), { weekStartsOn: 1 })
    }
  }

  const getEndDate = () => {
    switch (dateRange) {
      case 'week':
        return endOfWeek(new Date(), { weekStartsOn: 1 })
      case 'month':
        return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      case 'quarter':
        const quarter = Math.floor(new Date().getMonth() / 3)
        return new Date(new Date().getFullYear(), (quarter + 1) * 3, 0)
      case 'year':
        return new Date(new Date().getFullYear(), 11, 31)
      default:
        return endOfWeek(new Date(), { weekStartsOn: 1 })
    }
  }

  const getTotalHours = () => {
    const logs = getFilteredLogs()
    return logs.reduce((total, log) => total + (log.duration || 0), 0) / 60
  }

  const getBillableHours = () => {
    const logs = getFilteredLogs()
    return logs
      .filter(log => log.billable)
      .reduce((total, log) => total + (log.duration || 0), 0) / 60
  }

  const getAverageHoursPerDay = () => {
    const logs = getFilteredLogs()
    const totalHours = logs.reduce((total, log) => total + (log.duration || 0), 0) / 60
    const days = Math.ceil((getEndDate() - getStartDate()) / (1000 * 60 * 60 * 24))
    return days > 0 ? totalHours / days : 0
  }

  const getCategoryBreakdown = () => {
    const logs = getFilteredLogs()
    const breakdown = {}
    logs.forEach(log => {
      const category = log.category || 'other'
      breakdown[category] = (breakdown[category] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const getUserBreakdown = () => {
    const logs = getFilteredLogs()
    const breakdown = {}
    logs.forEach(log => {
      const userId = log.user_id
      breakdown[userId] = (breakdown[userId] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const getProjectBreakdown = () => {
    const logs = getFilteredLogs()
    const breakdown = {}
    logs.forEach(log => {
      const projectId = log.project_id
      breakdown[projectId] = (breakdown[projectId] || 0) + (log.duration || 0)
    })
    return breakdown
  }

  const getDailyTrends = () => {
    const logs = getFilteredLogs()
    const startDate = getStartDate()
    const endDate = getEndDate()
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    return days.map(day => {
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at)
        return format(logDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })
      
      const totalHours = dayLogs.reduce((total, log) => total + (log.duration || 0), 0) / 60
      const billableHours = dayLogs
        .filter(log => log.billable)
        .reduce((total, log) => total + (log.duration || 0), 0) / 60
      
      return {
        date: format(day, 'MMM dd'),
        total: totalHours,
        billable: billableHours,
        nonBillable: totalHours - billableHours
      }
    })
  }

  const getWeeklyTrends = () => {
    const logs = getFilteredLogs()
    const weeks = []
    const startDate = getStartDate()
    const endDate = getEndDate()
    
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at)
        return logDate >= weekStart && logDate <= weekEnd
      })
      
      const totalHours = weekLogs.reduce((total, log) => total + (log.duration || 0), 0) / 60
      const billableHours = weekLogs
        .filter(log => log.billable)
        .reduce((total, log) => total + (log.duration || 0), 0) / 60
      
      weeks.push({
        week: format(weekStart, 'MMM dd'),
        total: totalHours,
        billable: billableHours,
        nonBillable: totalHours - billableHours
      })
      
      currentDate.setDate(currentDate.getDate() + 7)
    }
    
    return weeks
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getCategoryColor = (category) => {
    const colors = {
      development: '#3b82f6',
      design: '#8b5cf6',
      testing: '#10b981',
      meeting: '#f59e0b',
      research: '#f97316',
      documentation: '#6b7280',
      other: '#9ca3af'
    }
    return colors[category] || colors.other
  }

  const categoryBreakdown = getCategoryBreakdown()
  const userBreakdown = getUserBreakdown()
  const projectBreakdown = getProjectBreakdown()
  const dailyTrends = getDailyTrends()
  const weeklyTrends = getWeeklyTrends()

  const categoryChartData = Object.entries(categoryBreakdown).map(([category, minutes]) => ({
    name: category,
    value: minutes / 60,
    color: getCategoryColor(category)
  }))

  const userChartData = Object.entries(userBreakdown).map(([userId, minutes]) => {
    const user = users.find(u => u.id === userId)
    return {
      name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      hours: minutes / 60
    }
  })

  const projectChartData = Object.entries(projectBreakdown).map(([projectId, minutes]) => {
    const project = projects.find(p => p.id === projectId)
    return {
      name: project?.name || 'Unknown',
      hours: minutes / 60
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Time Summary</h2>
          <p className="text-gray-600">
            {format(getStartDate(), 'MMM dd, yyyy')} - {format(getEndDate(), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="input"
            >
              <option value="overview">Overview</option>
              <option value="user">By User</option>
              <option value="project">By Project</option>
              <option value="trends">Trends</option>
            </select>
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
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg/Day</p>
              <p className="text-lg font-bold text-purple-600">{getAverageHoursPerDay().toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-bold text-orange-600">{Object.keys(userBreakdown).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Trends */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
                <Legend />
                <Bar dataKey="billable" fill="#10b981" name="Billable" />
                <Bar dataKey="nonBillable" fill="#6b7280" name="Non-Billable" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'user' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hours by User</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
              <Bar dataKey="hours" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'project' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hours by Project</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={projectChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
              <Bar dataKey="hours" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Hours" />
              <Line type="monotone" dataKey="billable" stroke="#10b981" name="Billable Hours" />
              <Line type="monotone" dataKey="nonBillable" stroke="#6b7280" name="Non-Billable Hours" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Details */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Details</h3>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, minutes]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatDuration(minutes)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* User Details */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
          <div className="space-y-3">
            {Object.entries(userBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([userId, minutes]) => {
                const user = users.find(u => u.id === userId)
                return (
                  <div key={userId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeSummary 