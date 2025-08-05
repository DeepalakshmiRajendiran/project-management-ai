import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import ProjectCard from '../components/ProjectCard'
import ProjectFilters from '../components/ProjectFilters'

const Projects = () => {
  const { 
    projects, 
    loading, 
    error, 
    fetchProjects, 
    getFilteredProjects,
    getProjectProgress,
    getStatusColor,
    getPriorityColor
  } = useProjects()
  
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = getFilteredProjects()

  // Ensure projects is always an array before filtering
  const projectsArray = Array.isArray(projects) ? projects : []
  console.log('Projects - projects state:', projects)
  console.log('Projects - projectsArray:', projectsArray)

  const getProjectStats = () => {
    const stats = {
      total: projectsArray.length,
      active: projectsArray.filter(p => p.status === 'active').length,
      completed: projectsArray.filter(p => p.status === 'completed').length,
      on_hold: projectsArray.filter(p => p.status === 'on_hold').length,
      overdue: projectsArray.filter(p => {
        if (p.status === 'completed') return false
        if (!p.end_date) return false
        return new Date(p.end_date) < new Date()
      }).length
    }
    return stats
  }

  const stats = getProjectStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading projects...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading projects</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => fetchProjects()}
          className="btn btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage and track all your projects
          </p>
        </div>
        <Link
          to="/projects/new"
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.on_hold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <ProjectFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ status: '', priority: '', search: '' })}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">
            {projects.length === 0 ? 'No projects have been created yet.' : 'No projects match your filters.'}
          </p>
          <Link
            to="/projects/new"
            className="btn btn-primary mt-4"
          >
            Create First Project
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects 