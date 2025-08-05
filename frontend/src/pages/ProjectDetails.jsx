import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import { teamAPI } from '../services/api'
import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  Activity,
  ArrowLeft,
  Edit,
  Plus,
  Filter,
  Search,
  Mail,
  Phone,
  Trash2,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import TaskList from '../components/TaskList'
import MilestoneModal from '../components/MilestoneModal'
import AddMemberModal from '../components/AddMemberModal'

const ProjectDetails = () => {
  const { id } = useParams()
  console.log('ProjectDetails component - Project ID from URL:', id)
  
  const { 
    getProjectById, 
    getProjectTasks, 
    getProjectMilestones, 
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskProgress,
    updateTaskStatus,
    deleteProject
  } = useProjects()
  const { user } = useAuth()
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [milestones, setMilestones] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        console.log('Fetching project data for ID:', id)
        setLoading(true)
        
        // Fetch data individually to better handle errors
        let projectData = null
        let tasksData = []
        let milestonesData = []
        
        try {
          projectData = await getProjectById(id)
          console.log('Project data:', projectData)
        } catch (error) {
          console.error('Error fetching project:', error)
        }
        
        try {
          tasksData = await getProjectTasks(id)
          console.log('Tasks data:', tasksData)
          // Ensure tasksData is always an array
          if (!Array.isArray(tasksData)) {
            console.error('Tasks data is not an array:', tasksData)
            tasksData = []
          }
        } catch (error) {
          console.error('Error fetching tasks:', error)
          tasksData = []
        }
        
        try {
          milestonesData = await getProjectMilestones(id)
          console.log('Milestones data:', milestonesData)
        } catch (error) {
          console.error('Error fetching milestones:', error)
        }
        

        
                 // Load team members
         let teamMembersData = []
         try {
          // Check if team members are included in the project data
          if (projectData && projectData.team_members) {
            teamMembersData = projectData.team_members
          } else {
           const teamResponse = await teamAPI.getTeamMembers(id)
           teamMembersData = teamResponse.data || []
          }
         } catch (error) {
           console.error('Error fetching team members:', error)
         }
        
                 setProject(projectData)
         setTasks(tasksData)
         setMilestones(milestonesData)
         setTeamMembers(Array.isArray(teamMembersData) ? teamMembersData : [])
      } catch (error) {
        console.error('Error in fetchProjectData:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProjectData()
    }
  }, [id])

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      project_manager: 'bg-purple-100 text-purple-800',
      developer: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
      viewer: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getMilestoneProgress = (milestone) => {
    // Try to get progress from multiple possible field names
    return milestone.progress_percentage || milestone.completion_percentage || 0
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleMilestoneSave = async (milestoneId, milestoneData) => {
    try {
      if (milestoneId) {
        // Update existing milestone
        const result = await updateMilestone(milestoneId, milestoneData)
        if (result.success) {
          // Refresh milestones
          const updatedMilestones = await getProjectMilestones(id)
          setMilestones(updatedMilestones)
        }
      } else {
        // Create new milestone
        const result = await createMilestone(milestoneData)
        if (result.success) {
          // Refresh milestones
          const updatedMilestones = await getProjectMilestones(id)
          setMilestones(updatedMilestones)
        }
      }
      
      setShowMilestoneModal(false)
      setSelectedMilestone(null)
    } catch (error) {
      console.error('Failed to save milestone:', error)
    }
  }

  const handleAddMember = async (memberData) => {
    try {
      console.log('Adding member to project:', memberData)
      console.log('memberData type:', typeof memberData)
      console.log('memberData keys:', Object.keys(memberData))
      
      // The memberData should already have user_id and role from the modal
      const requestData = {
        user_id: memberData.user_id || memberData.id,
        role: memberData.role || 'member'
      }
      console.log('Request data being sent:', requestData)
      console.log('user_id type:', typeof requestData.user_id)
      console.log('user_id value:', requestData.user_id)
      console.log('role value:', requestData.role)
      
      // Use the teamAPI to add member to project
      const response = await teamAPI.addTeamMember(id, requestData)
      
      console.log('Member added successfully:', response.data)
      setShowAddMemberModal(false)
      
      // Refresh the entire project data to get updated team members
      try {
        console.log('Refreshing project data...')
        const updatedProjectData = await getProjectById(id)
        console.log('Updated project data:', updatedProjectData)
        
        // Update the project state with new data
        setProject(updatedProjectData)
        
        // Update team members from the project data
        if (updatedProjectData && updatedProjectData.team_members) {
          setTeamMembers(updatedProjectData.team_members)
        }
      } catch (error) {
        console.error('Failed to refresh project data:', error)
      }
      
    } catch (error) {
      console.error('Failed to add member:', error)
      console.error('Error response:', error.response?.data)
      throw error
    }
  }

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(id)
        // Redirect to projects page after successful deletion
        window.location.href = '/projects'
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project. Please try again.')
      }
    }
  }

  // Ensure tasks is always an array before filtering
  const tasksArray = Array.isArray(tasks) ? tasks : []
  console.log('ProjectDetails - tasks state:', tasks)
  console.log('ProjectDetails - tasksArray:', tasksArray)

  const filteredTasks = tasksArray.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter
    return matchesSearch && matchesFilter
  })



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-gray-600 text-lg">Loading project details...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or failed to load.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-secondary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between py-6">
            {/* Left Section - Back button and Project Info */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              <div>
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.name}</h1>
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-1 max-w-md truncate">{project.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Status, Priority, and Actions */}
            <div className="flex items-center space-x-3">
              {/* Status and Priority Badges */}
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
              </button>
              <button 
                onClick={handleDeleteProject}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                title="Delete Project"
              >
                  <Trash2 className="h-4 w-4" />
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle },
              { id: 'milestones', label: 'Milestones', icon: TrendingUp },
              { id: 'team', label: 'Team', icon: Users },
              { id: 'activity', label: 'Activity', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Project Details */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-600" />
                  Project Details
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Start Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.start_date ? format(new Date(project.start_date), 'PPP') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">End Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.end_date ? format(new Date(project.end_date), 'PPP') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-3 w-3 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Budget</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Created By</p>
                        <p className="text-sm font-semibold text-gray-900">{project.created_by_name || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Created</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                        <Activity className="h-3 w-3 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Last Updated</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            projectId={id}
            onTaskUpdate={async (taskId, taskData) => {
              const result = await updateTask(taskId, taskData)
              if (result.success) {
                // Refresh tasks
                const updatedTasks = await getProjectTasks(id)
                setTasks(updatedTasks)
              }
            }}
            onTaskCreate={async (taskData) => {
              console.log('Creating task with data:', taskData)
              const result = await createTask(taskData)
              console.log('Task creation result:', result)
              if (result.success) {
                // Refresh tasks
                console.log('Refreshing tasks for project:', id)
                const updatedTasks = await getProjectTasks(id)
                console.log('Updated tasks:', updatedTasks)
                setTasks(updatedTasks)
              } else {
                console.error('Task creation failed:', result.error)
              }
            }}
            onTaskDelete={async (taskId) => {
              const result = await deleteTask(taskId)
              if (result.success) {
                // Remove task from local state
                setTasks(prev => prev.filter(task => task.id !== taskId))
              }
            }}
            onTaskAssign={async (taskId, userId) => {
              const result = await assignTask(taskId, userId)
              if (result.success) {
                // Refresh tasks
                const updatedTasks = await getProjectTasks(id)
                setTasks(updatedTasks)
              }
            }}
            onTaskProgressUpdate={async (taskId, progress, status) => {
              const result = await updateTaskProgress(taskId, progress)
              if (result.success) {
                // Refresh tasks
                const updatedTasks = await getProjectTasks(id)
                setTasks(updatedTasks)
              }
            }}
          />
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Milestones</h3>
              <button 
                onClick={() => {
                  setSelectedMilestone(null)
                  setShowMilestoneModal(true)
                }}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Milestone</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="bg-white rounded-lg border p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{milestone.name}</h4>
                    <span className={`status-badge ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                  
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-900">
                        {getMilestoneProgress(milestone)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${getProgressColor(getMilestoneProgress(milestone))}`}
                        style={{ width: `${getMilestoneProgress(milestone)}%` }}
                      ></div>
                    </div>
                    
                    {milestone.due_date && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
              <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddMemberModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
              >
                  <Plus className="h-4 w-4" />
                  <span>Add Team Member</span>
              </button>
              </div>
            </div>
            
                         <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                 {(!Array.isArray(teamMembers) || teamMembers.length === 0) ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-gray-400" />
                     </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                       {!Array.isArray(teamMembers) ? 'Unable to load team members' : 'No team members yet'}
                     </h3>
                    <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                       {!Array.isArray(teamMembers) 
                         ? 'There was an issue loading the team members. Please try refreshing the page.' 
                         : 'This project doesn\'t have any team members assigned yet. Add team members to start collaborating.'}
                     </p>
                     {Array.isArray(teamMembers) && teamMembers.length === 0 && (
                       <button
                         onClick={() => setShowAddMemberModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Add Team Member
                       </button>
                     )}
                   </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {Array.isArray(teamMembers) && teamMembers.map((member) => (
                      <div key={member.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 text-sm font-medium">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </h4>
                              <p className="text-xs text-gray-500">@{member.username}</p>
                            </div>
                          </div>
                          <span className={`status-badge ${getStatusColor(true ? 'active' : 'inactive')}`}>
                            Active
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          
                          {member.phone && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Role</span>
                                                    <span className={`priority-badge ${getRoleColor(member.project_role || 'member')}`}>
                          {member.project_role || 'Member'}
                        </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <div className="text-center text-sm text-gray-500">
                  Activity feed would be displayed here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Modal */}
        {showMilestoneModal && (
          <MilestoneModal
            milestone={selectedMilestone}
            projectId={id}
            onClose={() => {
              setShowMilestoneModal(false)
              setSelectedMilestone(null)
            }}
            onSave={handleMilestoneSave}
          />
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onSave={handleAddMember}
          />
        )}
      </div>
    </div>
  )
}

export default ProjectDetails 