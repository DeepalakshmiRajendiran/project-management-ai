import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  AlertCircle,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Folder,
  Play,
  Target,
  Activity,
  CheckSquare
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { reportsAPI, projectsAPI, tasksAPI, timeAPI } from '../services/api'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('month') // 'week', 'month', 'quarter', 'year'
  
  // Real data state
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalHours: 0,
    averageCompletion: 0,
    budgetUtilization: 0
  })
  const [projectStatusData, setProjectStatusData] = useState([])
  const [taskProgressData, setTaskProgressData] = useState([])
  const [timeTrackingData, setTimeTrackingData] = useState([])
  const [projectPerformanceData, setProjectPerformanceData] = useState([])

  useEffect(() => {
    loadReports()
  }, [timeRange])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Test one API call at a time to isolate the issue
      console.log('Testing individual API calls...')
      
      // Test 1: Projects API
      console.log('Testing projects API...')
      let projectsResponse
      try {
        projectsResponse = await projectsAPI.getAll({ status: '', priority: '', search: '' })
        console.log('Projects API response:', projectsResponse.data)
      } catch (error) {
        console.error('Projects API error:', error.response?.data || error.message)
        throw new Error(`Projects API failed: ${error.response?.data?.error || error.message}`)
      }
      
      // Test 2: Time Summary API
      console.log('Testing time summary API...')
      let timeSummaryResponse
      try {
        timeSummaryResponse = await timeAPI.getSummary({ timeRange })
        console.log('Time summary API response:', timeSummaryResponse.data)
      } catch (error) {
        console.error('Time summary API error:', error.response?.data || error.message)
        throw new Error(`Time summary API failed: ${error.response?.data?.error || error.message}`)
      }
      
      // Test 3: Time Breakdown API
      console.log('Testing time breakdown API...')
      let timeBreakdownResponse
      try {
        timeBreakdownResponse = await timeAPI.getProjectBreakdown({ timeRange })
        console.log('Time breakdown API response:', timeBreakdownResponse.data)
      } catch (error) {
        console.error('Time breakdown API error:', error.response?.data || error.message)
        throw new Error(`Time breakdown API failed: ${error.response?.data?.error || error.message}`)
      }

      console.log('Reports API responses:', {
        projects: projectsResponse.data,
        timeSummary: timeSummaryResponse.data,
        timeBreakdown: timeBreakdownResponse.data
      })
      
      console.log('Time range used:', timeRange)
      console.log('API URLs called:', [
        '/projects',
        '/time-logs/summary',
        '/time-logs/projects'
      ])

      // Process projects data
      const projects = projectsResponse.data?.data || []
      console.log('Raw projects data:', projects)
      
      const activeProjects = projects.filter(p => p.status === 'active').length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      const onHoldProjects = projects.filter(p => p.status === 'on_hold').length
      const cancelledProjects = projects.filter(p => p.status === 'cancelled').length
      
      console.log('Project status counts:', {
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
        cancelled: cancelledProjects
      })

      // Process tasks data from projects
      let totalTasks = 0
      let completedTasks = 0
      let inProgressTasks = 0
      let reviewTasks = 0
      let todoTasks = 0
      
      console.log('Processing tasks from projects:', projects.map(p => ({
        name: p.name,
        tasks_count: p.tasks_count,
        completed_tasks_count: p.completed_tasks_count
      })))
      
      projects.forEach(project => {
        // Use the correct field names from backend
        const projectTasksCount = parseInt(project.tasks_count) || 0
        const projectCompletedTasks = parseInt(project.completed_tasks_count) || 0
        
        totalTasks += projectTasksCount
        completedTasks += projectCompletedTasks
        
        // Estimate in-progress tasks (this is a rough calculation)
        // Assuming some tasks are in progress if not completed
        const remainingTasks = projectTasksCount - projectCompletedTasks
        if (remainingTasks > 0) {
          inProgressTasks += Math.ceil(remainingTasks * 0.6) // Assume 60% of remaining tasks are in progress
        }
      })

      console.log('Task counts calculated:', {
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks
      })

      // Process time data
      const timeSummary = timeSummaryResponse.data?.data || {}
      const timeBreakdown = timeBreakdownResponse.data?.data || []

      // Calculate statistics
      const totalHours = timeSummary.total_hours || 0
      const taskCompletionPercentage = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0
      const projectCompletionPercentage = projects.length > 0 
        ? Math.round((completedProjects / projects.length) * 100)
        : 0

      // Update state
      setStats({
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        totalHours: Math.round(totalHours * 10) / 10,
        averageCompletion: taskCompletionPercentage, // Changed to task completion
        budgetUtilization: 85 // This would need budget data from projects
      })

      // Update chart data - filter out zero values to prevent display issues
      const projectStatusData = [
        { name: 'Active', value: activeProjects, color: '#10B981' },
        { name: 'Completed', value: completedProjects, color: '#3B82F6' },
        { name: 'On Hold', value: onHoldProjects, color: '#F59E0B' },
        { name: 'Cancelled', value: cancelledProjects, color: '#EF4444' }
      ].filter(item => item.value > 0) // Only show categories with values > 0

      setProjectStatusData(projectStatusData)
      console.log('Project status data for chart:', projectStatusData)

      const taskProgressData = [
        { name: 'Completed', value: completedTasks, color: '#10B981' },
        { name: 'In Progress', value: inProgressTasks, color: '#3B82F6' },
        { name: 'Other', value: Math.max(0, totalTasks - completedTasks - inProgressTasks), color: '#6B7280' }
      ].filter(item => item.value > 0) // Only show categories with values > 0

      setTaskProgressData(taskProgressData)
      console.log('Task progress data for chart:', taskProgressData)
      console.log('Total tasks available:', totalTasks)

      // Generate time tracking data from breakdown
      const timeData = timeBreakdown.map(item => ({
        month: item.month || item.project_name,
        hours: parseFloat(item.total_hours) || 0,
        projects: item.project_count || 1
      }))
      setTimeTrackingData(timeData)

      // Generate project performance data
      const performanceData = projects.slice(0, 5).map(project => {
        const progress = project.progress_percentage || 0
        const budget = parseFloat(project.budget) || 1000 // Default budget if not set
        const timeSpent = parseFloat(project.total_time_spent) || 0
        const hourlyRate = 50 // Realistic hourly rate
        const spent = timeSpent * hourlyRate
        
        return {
          name: project.name,
          progress: Math.round(progress),
          budget: budget,
          spent: Math.round(spent),
          status: progress >= 80 ? 'On Track' :
                 progress >= 60 ? 'In Progress' :
                 progress >= 40 ? 'At Risk' : 'Behind'
        }
      })
      setProjectPerformanceData(performanceData)

    } catch (error) {
      console.error('Failed to load reports:', error)
      console.error('Error details:', error.response?.data || error.message)
      setError(`Failed to load reports: ${error.response?.data?.error || error.message}`)
      
      // Set fallback data
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalHours: 0,
        averageCompletion: 0,
        budgetUtilization: 0
      })
      setProjectStatusData([])
      setTaskProgressData([])
      setTimeTrackingData([])
      setProjectPerformanceData([])
    } finally {
      setLoading(false)
    }
  }

  const exportReports = async () => {
    try {
      const response = await timeAPI.exportTimesheet({ 
        timeRange,
        format: 'csv'
      })
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reports-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export reports:', error)
      setError('Failed to export reports')
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin h-6 w-6 text-blue-600" />
          <span className="text-gray-600">Loading reports...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading reports</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadReports}
          className="btn btn-primary flex items-center mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600">Analytics & insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadReports}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2"
            title="Refresh Reports"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={exportReports}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
            title="Export Reports"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-xl border shadow-sm p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalHours}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageCompletion}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <PieChart className="h-4 w-4 mr-2 text-blue-600" />
            Project Status
          </h3>
          {projectStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No project data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Task Progress Distribution */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
            Task Progress
          </h3>
          {taskProgressData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskProgressData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {taskProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <div className="text-center">
                <CheckSquare className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {stats.totalTasks === 0 ? 'No tasks created yet' : 'No task progress data available'}
                </p>
                {stats.totalTasks === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Create tasks in your projects to see progress</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Tracking Chart */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-yellow-600" />
          Time Trends
        </h3>
        {timeTrackingData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeTrackingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} />
            <Line type="monotone" dataKey="projects" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            <div className="text-center">
              <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No time tracking data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Project Performance Table */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Project Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-1" />
                    Project
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                    Progress
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                    Budget
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                    Spent
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                    Status
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectPerformanceData.length > 0 ? (
                  projectPerformanceData.map((project, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[2.5rem] text-right">{project.progress}%</span>
                      </div>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${project.budget.toLocaleString()}
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${project.spent.toLocaleString()}
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'On Track' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'At Risk' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                          {project.status}
                      </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <BarChart3 className="h-8 w-8 mb-2 text-gray-400" />
                        <p>No project performance data available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports 