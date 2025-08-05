const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

// Validation middleware
const validateProject = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Project name is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid end date format'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
];

const validateProjectUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Project name must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid end date format'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
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

// GET /api/projects - Get all projects (with pagination and filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const result = await projectController.getAllProjects(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      priority,
      search
    });
    
    res.json({
      success: true,
      data: result.projects,
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
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// GET /api/projects/:id - Get project by ID with milestones and team members
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await projectController.getProjectById(req.params.id, req.user.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// POST /api/projects - Create new project
router.post('/', auth, validateProject, handleValidationErrors, async (req, res) => {
  try {
    const project = await projectController.createProject(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, validateProjectUpdate, handleValidationErrors, async (req, res) => {
  try {
    const project = await projectController.updateProject(req.params.id, req.body, req.user.id);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    await projectController.deleteProject(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const stats = await projectController.getProjectStats(req.params.id, req.user.id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project statistics',
      error: error.message
    });
  }
});

module.exports = router; 