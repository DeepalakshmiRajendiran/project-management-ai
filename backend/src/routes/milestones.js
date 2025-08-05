const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const milestoneController = require('../controllers/milestoneController');

// Validation middleware
const validateMilestone = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Milestone name is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date format'),
  body('completion_percentage').optional().isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100')
];

const validateMilestoneUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Milestone name must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date format'),
  body('completion_percentage').optional().isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100')
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

// GET /api/milestones/project/:projectId - Get all milestones for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const milestones = await milestoneController.getProjectMilestones(req.params.projectId, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestones',
      error: error.message
    });
  }
});

// GET /api/milestones/:id - Get milestone by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const milestone = await milestoneController.getMilestoneById(req.params.id, req.user.id);
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestone',
      error: error.message
    });
  }
});

// POST /api/milestones - Create new milestone
router.post('/', auth, validateMilestone, handleValidationErrors, async (req, res) => {
  try {
    const milestone = await milestoneController.createMilestone(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: milestone
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create milestone',
      error: error.message
    });
  }
});

// PUT /api/milestones/:id - Update milestone
router.put('/:id', auth, validateMilestoneUpdate, handleValidationErrors, async (req, res) => {
  try {
    const milestone = await milestoneController.updateMilestone(req.params.id, req.body, req.user.id);
    
    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: milestone
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to update milestone',
      error: error.message
    });
  }
});

// PATCH /api/milestones/:id/status - Update milestone status
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
], handleValidationErrors, async (req, res) => {
  try {
    const milestone = await milestoneController.updateMilestoneStatus(req.params.id, req.body.status, req.user.id);
    
    res.json({
      success: true,
      message: 'Milestone status updated successfully',
      data: milestone
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to update milestone status',
      error: error.message
    });
  }
});

// DELETE /api/milestones/:id - Delete milestone
router.delete('/:id', auth, async (req, res) => {
  try {
    await milestoneController.deleteMilestone(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to delete milestone',
      error: error.message
    });
  }
});

// GET /api/milestones/:id/stats - Get milestone statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const stats = await milestoneController.getMilestoneStats(req.params.id, req.user.id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestone statistics',
      error: error.message
    });
  }
});

// GET /api/milestones/overdue - Get overdue milestones for current user
router.get('/overdue', auth, async (req, res) => {
  try {
    const milestones = await milestoneController.getOverdueMilestones(req.user.id);
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue milestones',
      error: error.message
    });
  }
});

// GET /api/milestones/upcoming - Get upcoming milestones for current user
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const milestones = await milestoneController.getUpcomingMilestones(req.user.id, parseInt(days));
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming milestones',
      error: error.message
    });
  }
});

module.exports = router; 