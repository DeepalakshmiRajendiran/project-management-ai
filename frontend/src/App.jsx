import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import NewProject from './pages/NewProject'
import ProjectDetails from './pages/ProjectDetails'
import MilestoneDetails from './pages/MilestoneDetails'

import Reports from './pages/Reports'
import Settings from './pages/Settings'
import TimeTracking from './pages/TimeTracking'
import TeamManagement from './pages/TeamManagement'
import InviteAccept from './pages/InviteAccept'

// Components
import Layout from './components/Layout'
import ToastContainer from './components/ToastContainer'

// Styles
import './styles/task-detail.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/invite" element={<InviteAccept />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          } />
          <Route path="/milestones/:id" element={
            <ProtectedRoute>
              <MilestoneDetails />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/projects/new" element={
            <ProtectedRoute>
              <NewProject />
            </ProtectedRoute>
          } />

          <Route path="/team-management" element={
            <ProtectedRoute>
              <TeamManagement />
            </ProtectedRoute>
          } />

          <Route path="/time-tracking" element={
            <ProtectedRoute>
              <TimeTracking />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
        <ToastContainer />
      </ProjectProvider>
    </AuthProvider>
  )
}

export default App 