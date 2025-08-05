const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// Validation middleware
const validateComment = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be less than 2000 characters'),
  body('task_id').optional().isUUID().withMessage('Valid task ID is required'),
  body('project_id').optional().isUUID().withMessage('Valid project ID is required'),
  body('milestone_id').optional().isUUID().withMessage('Valid milestone ID is required'),
  body('parent_comment_id').optional().isUUID().withMessage('Valid parent comment ID is required')
];

const validateCommentUpdate = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be less than 2000 characters')
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

// GET /api/comments/task/:taskId - Get comments for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await commentController.getTaskComments(req.params.taskId, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result.comments,
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
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// GET /api/comments/project/:projectId - Get comments for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await commentController.getProjectComments(req.params.projectId, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result.comments,
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
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// GET /api/comments/:id - Get comment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const comment = await commentController.getCommentById(req.params.id, req.user.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment',
      error: error.message
    });
  }
});

// POST /api/comments - Create new comment
router.post('/', auth, validateComment, handleValidationErrors, async (req, res) => {
  try {
    const comment = await commentController.createComment(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', auth, validateCommentUpdate, handleValidationErrors, async (req, res) => {
  try {
    const comment = await commentController.updateComment(req.params.id, req.body.content, req.user.id);
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    await commentController.deleteComment(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
});

module.exports = router; 