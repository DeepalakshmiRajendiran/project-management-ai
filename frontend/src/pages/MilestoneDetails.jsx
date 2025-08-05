import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
  ArrowLeft,
  Edit,
  Plus,
  Filter,
  Search,
  Target,
  BarChart3,
  CalendarDays
} from 'lucide-react'
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const MilestoneDetails = () => {
  const { id } = useParams()
  const { getMilestoneById, getMilestoneTasks, getProjectById } = useProjects()
  const { user } = useAuth()
  
  const [milestone, setMilestone] = useState(null)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchMilestoneData = async () => {
      try {
        setLoading(true)
        const [milestoneData, tasksData] = await Promise.all([
          getMilestoneById(id),
          getMilestoneTasks(id)
        ])
        
        setMilestone(milestoneData)
        setTasks(tasksData)
        
        // Fetch project data if milestone has project_id
        if (milestoneData?.project_id) {
          const projectData = await getProjectById(milestoneData.project_id)
          setProject(projectData)
        }
      } catch (error) {
        console.error('Error fetching milestone data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMilestoneData()
    }
  }, [id, getMilestoneById, getMilestoneTasks, getProjectById])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTimelineStatus = (dueDate) => {
    if (!dueDate) return 'no-due-date'
    const daysRemaining = getDaysRemaining(dueDate)
    if (daysRemaining < 0) return 'overdue'
    if (daysRemaining <= 7) return 'urgent'
    if (daysRemaining <= 14) return 'warning'
    return 'on-track'
  }

  // Ensure tasks is always an array before filtering
  const tasksArray = Array.isArray(tasks) ? tasks : []
  console.log('MilestoneDetails - tasks state:', tasks)
  console.log('MilestoneDetails - tasksArray:', tasksArray)

  const filteredTasks = tasksArray.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter
    return matchesSearch && matchesFilter
  })

  const taskStatusData = [
    { name: 'Completed', value: tasksArray.filter(t => t.status === 'completed').length, color: '#10B981' },
    { name: 'In Progress', value: tasksArray.filter(t => t.status === 'in_progress').length, color: '#3B82F6' },
    { name: 'Review', value: tasksArray.filter(t => t.status === 'review').length, color: '#F59E0B' },
    { name: 'Todo', value: tasksArray.filter(t => t.status === 'todo').length, color: '#6B7280' }
  ]

  const progressData = [
    { name: 'Week 1', completed: 20, total: 25 },
    { name: 'Week 2', completed: 35, total: 40 },
    { name: 'Week 3', completed: 50, total: 55 },
    { name: 'Week 4', completed: 65, total: 70 },
    { name: 'Current', completed: milestone?.completion_percentage || 0, total: 100 }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading milestone details...</span>
        </div>
      </div>
    )
  }

  if (!milestone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Milestone Not Found</h2>
          <p className="text-gray-600 mb-4">The milestone you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(milestone.due_date)
  const timelineStatus = getTimelineStatus(milestone.due_date)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link to={`/projects/${milestone.project_id}`} className="btn btn-ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{milestone.name}</h1>
                <p className="text-gray-600">{milestone.description}</p>
                {project && (
                  <p className="text-sm text-gray-500">
                    Project: {project.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`status-badge ${getStatusColor(milestone.status)}`}>
                {milestone.status.replace('_', ' ')}
              </span>
              <button className="btn btn-primary">
                <Edit className="h-4 w-4 mr-2" />
                Edit Milestone
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-lg font-semibold text-gray-900">
                  {milestone.completion_percentage}%
                </span>
              </div>
              
              {milestone.due_date && (
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Due Date</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                  </span>
                  {daysRemaining !== null && (
                    <span className={`text-sm font-medium ${
                      timelineStatus === 'overdue' ? 'text-red-600' :
                      timelineStatus === 'urgent' ? 'text-orange-600' :
                      timelineStatus === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      ({daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`})
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="w-64 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getProgressColor(milestone.completion_percentage)}`}
                style={{ width: `${milestone.completion_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'activity', label: 'Activity', icon: MessageSquare }
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Milestone Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasksArray.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasksArray.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasksArray.filter(t => t.assigned_to).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Milestone Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Milestone Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Due Date</p>
                        <p className="text-sm text-gray-900">
                          {milestone.due_date ? format(new Date(milestone.due_date), 'PPP') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Timeline Status</p>
                        <p className={`text-sm font-medium ${
                          timelineStatus === 'overdue' ? 'text-red-600' :
                          timelineStatus === 'urgent' ? 'text-orange-600' :
                          timelineStatus === 'warning' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {timelineStatus === 'overdue' ? 'Overdue' :
                           timelineStatus === 'urgent' ? 'Urgent' :
                           timelineStatus === 'warning' ? 'Warning' :
                           timelineStatus === 'on-track' ? 'On Track' :
                           'No Due Date'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created By</p>
                        <p className="text-sm text-gray-900">{milestone.created_by_name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created</p>
                        <p className="text-sm text-gray-900">
                          {formatDistanceToNow(new Date(milestone.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Updated</p>
                        <p className="text-sm text-gray-900">
                          {formatDistanceToNow(new Date(milestone.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {milestone.due_date && daysRemaining !== null && (
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Days Remaining</p>
                          <p className={`text-sm font-medium ${
                            daysRemaining < 0 ? 'text-red-600' :
                            daysRemaining <= 7 ? 'text-orange-600' :
                            daysRemaining <= 14 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)} days overdue`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Tasks</option>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tasks ({filteredTasks.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                          <span className={`status-badge ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="mt-2 text-gray-600">{task.description}</p>
                        )}
                        
                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                          {task.assigned_to_name && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{task.assigned_to_name}</span>
                            </div>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          
                          {task.estimated_hours && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{task.estimated_hours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-6 flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {task.progress_percentage}%
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(task.progress_percentage)}`}
                              style={{ width: `${task.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTasks.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No tasks found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Milestone Timeline</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                {/* Timeline Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Progress Timeline</h3>
                    <p className="text-sm text-gray-600">Track milestone progress over time</p>
                  </div>
                  
                  {milestone.due_date && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Due Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Timeline Visualization */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {progressData.map((week, index) => (
                      <div key={index} className="relative flex items-start">
                        <div className="absolute left-2 top-2 w-3 h-3 bg-primary-500 rounded-full"></div>
                        <div className="ml-8 flex-1">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{week.name}</h4>
                              <span className="text-sm text-gray-600">
                                {week.completed}/{week.total} tasks
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${(week.completed / week.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Progress Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {milestone.completion_percentage}%
                  </div>
                  <p className="text-gray-600">Overall completion</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="text-center text-gray-500">
                  Activity feed would be displayed here
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MilestoneDetails 