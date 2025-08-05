const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const teamController = require('../controllers/teamController');
const { pool } = require('../config/database');

// Validation middleware
const validateAddMember = [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
           body('role').optional().isIn(['member', 'developer', 'project_manager', 'viewer']).withMessage('Invalid role')
];

const validateUpdateRole = [
     body('role').isIn(['member', 'developer', 'project_manager', 'viewer']).withMessage('Invalid role')
];

// Check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/team/users - Get all users (authenticated users)
router.get('/users', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, is_active, role } = req.query;
    const result = await teamController.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: is_active ? is_active === 'true' : undefined,
      role
    });
    
    res.json({
      success: true,
      data: result.users,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// GET /api/team/users/:id - Get user by ID
router.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await teamController.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// GET /api/team/project/:projectId/current-user-role - Get current user's role in project
router.get('/project/:projectId/current-user-role', auth, async (req, res) => {
  try {
    const result = await teamController.getCurrentUserRole(req.params.projectId, req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user role',
      error: error.message
    });
  }
});

// GET /api/team/project/:projectId - Get project team members
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const team = await teamController.getProjectTeam(req.params.projectId, req.user.id);
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project team',
      error: error.message
    });
  }
});

// POST /api/team/project/:projectId/members - Add user to project
router.post('/project/:projectId/members', auth, validateAddMember, handleValidationErrors, async (req, res) => {
  try {
    const { user_id, role = 'member' } = req.body;
    const member = await teamController.addUserToProject(req.params.projectId, req.user.id, user_id, role);
    
    res.status(201).json({
      success: true,
      message: 'User added to project successfully',
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add user to project',
      error: error.message
    });
  }
});

// PUT /api/team/project/:projectId/members/:userId/role - Update project member role
router.put('/project/:projectId/members/:userId/role', auth, validateUpdateRole, handleValidationErrors, async (req, res) => {
  try {
    const member = await teamController.updateProjectMemberRole(req.params.projectId, req.user.id, req.params.userId, req.body.role);
    
    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update member role',
      error: error.message
    });
  }
});

// DELETE /api/team/project/:projectId/members/:userId - Remove user from project
router.delete('/project/:projectId/members/:userId', auth, async (req, res) => {
  try {
    await teamController.removeUserFromProject(req.params.projectId, req.user.id, req.params.userId);
    
    res.json({
      success: true,
      message: 'User removed from project successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to remove user from project',
      error: error.message
    });
  }
});

// GET /api/team/user/projects - Get user's projects
router.get('/user/projects', auth, async (req, res) => {
  try {
    const projects = await teamController.getUserProjects(req.user.id);
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user projects',
      error: error.message
    });
  }
});

// GET /api/team/user/assigned-tasks - Get user's assigned tasks
router.get('/user/assigned-tasks', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, project_id, status, priority } = req.query;
    const result = await teamController.getUserAssignedTasks(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      project_id,
      status,
      priority
    });
    
    res.json({
      success: true,
      data: result.tasks,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned tasks',
      error: error.message
    });
  }
});

// GET /api/team/user/stats - Get user statistics
router.get('/user/stats', auth, async (req, res) => {
  try {
    const stats = await teamController.getUserStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

// POST /api/team/users - Create new user (admin only)
router.post('/users', auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2',
      [req.user.id, 'admin']
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await teamController.createUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// PUT /api/team/users/:id - Update user (admin only)
router.put('/users/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2',
      [req.user.id, 'admin']
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await teamController.updateUser(req.params.id, req.body);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// DELETE /api/team/users/:id - Delete user (admin only)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2',
      [req.user.id, 'admin']
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const deleted = await teamController.deleteUser(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router; 