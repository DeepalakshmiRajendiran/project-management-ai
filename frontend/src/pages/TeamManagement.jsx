import React, { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Settings, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  FolderOpen,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { teamAPI, projectsAPI } from '../services/api'
import InviteMemberModal from '../components/InviteMemberModal'
import UserProfileModal from '../components/UserProfileModal'
import RoleAssignmentModal from '../components/RoleAssignmentModal'

const TeamManagement = () => {
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [invitations, setInvitations] = useState([]) // Add invitations state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectTeams, setProjectTeams] = useState({})

  useEffect(() => {
    console.log('TeamManagement component mounted')
    console.log('Auth token:', localStorage.getItem('authToken'))
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('Loading team data...')
      
      const [usersRes, projectsRes, invitationsRes] = await Promise.all([
        teamAPI.getUsers(),
        projectsAPI.getAll(),
        teamAPI.getInvitations() // Add invitations API call
      ])

      console.log('Users response:', usersRes)
      console.log('Projects response:', projectsRes)
      console.log('Invitations response:', invitationsRes)

      const usersData = usersRes.data?.data || usersRes.data || []
      const projectsData = projectsRes.data?.data || projectsRes.data || []
      const invitationsData = invitationsRes.data?.data || invitationsRes.data || []

      console.log('Processed users data:', usersData)
      console.log('Processed projects data:', projectsData)
      console.log('Processed invitations data:', invitationsData)
      console.log('Users data structure:', usersData.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email })))

      setUsers(usersData)
      setProjects(projectsData)
      setInvitations(invitationsData)

             // Fetch team members for each project
      const teamsData = {}
      for (const project of projectsData) {
        try {
          console.log(`Fetching team members for project: ${project.name} (${project.id})`)
          const teamResponse = await teamAPI.getTeamMembers(project.id)
          console.log(`Raw team response for project ${project.id}:`, teamResponse)
          
          // Handle different response structures
          let teamMembers = []
          if (teamResponse.data && teamResponse.data.data) {
            teamMembers = teamResponse.data.data
          } else if (teamResponse.data) {
            teamMembers = Array.isArray(teamResponse.data) ? teamResponse.data : []
          } else {
            teamMembers = []
          }
          
          teamsData[project.id] = teamMembers
          console.log(`Processed team members for project ${project.id}:`, teamMembers)
          console.log(`Number of team members: ${teamMembers.length}`)
        } catch (error) {
          console.error(`Failed to fetch team members for project ${project.id}:`, error)
          console.error(`Error details:`, error.response?.data)
          // If access is denied, we'll show an empty team for this project
          // This allows the user to still see the project but with no team members
          teamsData[project.id] = []
        }
      }

             setProjectTeams(teamsData)
       console.log('Final teams data:', teamsData)
    } catch (error) {
      console.error('Failed to load team data:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = () => {
    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter) {
      // Handle pending status - show empty since pending people are invitations
      if (statusFilter === 'pending') {
        return []
      }
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    return filtered
  }

  const getProjectTeam = (projectId) => {
    // Return team members for the specified project from our stored data
    // Ensure we always return an array, even if the data is undefined
    const teamMembers = projectTeams[projectId]
    console.log(`getProjectTeam(${projectId}):`, teamMembers, 'type:', typeof teamMembers, 'isArray:', Array.isArray(teamMembers))
    console.log('All projectTeams:', projectTeams)
    console.log('Available project IDs:', Object.keys(projectTeams))
    return Array.isArray(teamMembers) ? teamMembers : []
  }

  const getRoleColor = (role) => {
    switch (role) {

      case 'project_manager':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-purple-100 text-purple-800'
      case 'viewer':
        return 'bg-orange-100 text-orange-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const handleInviteMember = async (inviteData) => {
    try {
      await teamAPI.inviteUser(inviteData)
      setShowInviteModal(false)
      loadData() // Refresh data
      if (window.showToast) {
        window.showToast.success('Invitation Sent', 'User has been invited successfully')
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
      if (window.showToast) {
        window.showToast.error('Invitation Failed', 'Failed to send invitation')
      }
    }
  }

  const handleUpdateUser = async (userId, userData) => {
    try {
      await teamAPI.updateUser(userId, userData)
      setShowUserProfile(false)
      setSelectedUser(null)
      loadData() // Refresh data
      if (window.showToast) {
        window.showToast.success('User Updated', 'User information updated successfully')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      if (window.showToast) {
        window.showToast.error('Update Failed', 'Failed to update user information')
      }
    }
  }

  const handleAssignRole = async (userId, projectId, roleData) => {
    try {
      await teamAPI.assignRole(userId, projectId, roleData)
      setShowRoleModal(false)
      setSelectedUser(null)
      setSelectedProject(null)
      loadData() // Refresh data
      if (window.showToast) {
        window.showToast.success('Role Assigned', 'Role has been assigned successfully')
      }
    } catch (error) {
      console.error('Failed to assign role:', error)
      if (window.showToast) {
        window.showToast.error('Assignment Failed', 'Failed to assign role')
      }
    }
  }

  const handleAddTeamMember = async (projectId, memberData) => {
    try {
      await teamAPI.addTeamMember(projectId, memberData)
      loadData() // Refresh data after adding member
      if (window.showToast) {
        window.showToast.success('Member Added', 'Team member has been added successfully')
      }
    } catch (error) {
      console.error('Failed to add team member:', error)
      if (window.showToast) {
        window.showToast.error('Add Failed', 'Failed to add team member')
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await teamAPI.deleteUser(userId)
        loadData() // Refresh data
        if (window.showToast) {
          window.showToast.success('User Deleted', 'User has been deleted successfully')
        }
      } catch (error) {
        console.error('Failed to delete user:', error)
        if (window.showToast) {
          window.showToast.error('Deletion Failed', 'Failed to delete user')
        }
      }
    }
  }

  const getStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length // Count pending invitations
    const adminUsers = users.filter(u => u.role === 'admin').length

    return { totalUsers, activeUsers, pendingInvitations, adminUsers }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading team data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">
            Manage team members, roles, and project assignments
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={projects.length === 0}
          className={`btn flex items-center space-x-2 ${
            projects.length === 0 
              ? 'btn-disabled bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'btn-primary'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-lg font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-lg font-bold text-gray-900">{stats.pendingInvitations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-lg font-bold text-gray-900">{stats.adminUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invitations
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Project Teams
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Roles</option>
         
                  <option value="project_manager">Project Manager</option>
                  <option value="developer">Developer</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredUsers().length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {users.length === 0 ? 'No team members yet' : 'No members found'}
                        </h3>
                        <p className="text-gray-600 mb-4 max-w-md mx-auto">
                          {users.length === 0 
                            ? 'Your team is empty. Start by inviting team members to collaborate on projects.'
                            : 'No team members match your current filters. Try adjusting your search criteria.'}
                        </p>
                        {users.length === 0 && (
                          <button
                            onClick={() => setShowInviteModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite First Member
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    getFilteredUsers().map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`priority-badge ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(user.status)}
                          <span className={`ml-2 priority-badge ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserProfile(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRoleModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Assign Role"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                You have no pending invitations at the moment.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invitation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-primary-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {invitation.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                Role: {invitation.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(invitation.status)}
                            <span className={`ml-2 priority-badge ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.created_at ? format(new Date(invitation.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {invitation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    // Logic to resend invitation
                                    console.log('Resend invitation for:', invitation)
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Resend Invitation"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    // Logic to cancel invitation
                                    console.log('Cancel invitation for:', invitation)
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancel Invitation"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Project Teams</h2>
              <p className="text-sm text-gray-600 mt-1">Manage team members for each project</p>
            </div>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                There are no projects available. Create a project to start managing team assignments.
              </p>
            </div>
          ) : (
            projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Team Members ({getProjectTeam(project.id).length})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProject(project)
                      setShowInviteModal(true)
                    }}
                    disabled={projects.length === 0}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Team Member</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getProjectTeam(project.id).map((member) => {
                    const user = users.find(u => u.id === member.user_id)
                    
                    if (!user) {
                      return (
                        <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-red-50">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-sm font-medium">?</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900">
                              User ID: {member.user_id}
                            </p>
                            <p className="text-sm text-red-700">User not found in users list</p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`priority-badge ${getRoleColor(member.project_role)}`}>
                              {member.project_role}
                            </span>
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={member.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 text-xs font-medium">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`priority-badge ${getRoleColor(member.project_role)}`}>
                            {member.project_role}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                                 {getProjectTeam(project.id).length === 0 && (
                   <div className="text-center py-6">
                     <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                       <Users className="h-5 w-5 text-gray-400" />
                     </div>
                     <h4 className="text-sm font-medium text-gray-900 mb-1">No team members</h4>
                     <p className="text-xs text-gray-500 mb-3">
                       {projectTeams[project.id] === undefined 
                         ? 'Unable to load team members due to access restrictions.'
                         : 'This project doesn\'t have any team members assigned yet.'
                       }
                     </p>
                     {projectTeams[project.id] !== undefined && (
                       <button
                         onClick={() => {
                           setSelectedProject(project)
                           setShowInviteModal(true)
                         }}
                         disabled={projects.length === 0}
                         className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm transition-colors ${
                           projects.length === 0
                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                             : 'text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                         }`}
                       >
                         <Plus className="h-3 w-3 mr-1" />
                         Invite Member
                       </button>
                     )}
                   </div>
                 )}
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
        projects={projects}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onUpdate={handleUpdateUser}
      />

      <RoleAssignmentModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setSelectedUser(null)
          setSelectedProject(null)
        }}
        user={selectedUser}
        projects={projects}
        onAssign={handleAssignRole}
      />
    </div>
  )
}

export default TeamManagement 