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
  Cell
} from 'recharts'
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useProjects } from '../contexts/ProjectContext'

const DashboardStats = () => {
  const { projects, getFilteredProjects } = useProjects()
  const filteredProjects = getFilteredProjects()

  // Calculate statistics
  const stats = {
    total: filteredProjects.length,
    active: filteredProjects.filter(p => p.status === 'active').length,
    completed: filteredProjects.filter(p => p.status === 'completed').length,
    onHold: filteredProjects.filter(p => p.status === 'on_hold').length,
    cancelled: filteredProjects.filter(p => p.status === 'cancelled').length,
    urgent: filteredProjects.filter(p => p.priority === 'urgent').length,
    high: filteredProjects.filter(p => p.priority === 'high').length,
    medium: filteredProjects.filter(p => p.priority === 'medium').length,
    low: filteredProjects.filter(p => p.priority === 'low').length,
  }

  // Status distribution for pie chart
  const statusData = [
    { name: 'Active', value: stats.active, color: '#22c55e' },
    { name: 'Completed', value: stats.completed, color: '#3b82f6' },
    { name: 'On Hold', value: stats.onHold, color: '#f59e0b' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
  ].filter(item => item.value > 0)

  // Priority distribution for bar chart
  const priorityData = [
    { name: 'Urgent', value: stats.urgent, color: '#ef4444' },
    { name: 'High', value: stats.high, color: '#f59e0b' },
    { name: 'Medium', value: stats.medium, color: '#3b82f6' },
    { name: 'Low', value: stats.low, color: '#6b7280' },
  ]

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={FolderOpen}
          color="bg-primary-500"
        />
        <StatCard
          title="Active Projects"
          value={stats.active}
          icon={TrendingUp}
          color="bg-success-500"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-primary-500"
        />
        <StatCard
          title="On Hold"
          value={stats.onHold}
          icon={Clock}
          color="bg-warning-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Priority Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <FolderOpen className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Create New Project</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Users className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Manage Team</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Calendar className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Calendar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats 