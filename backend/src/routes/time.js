const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const timeController = require('../controllers/timeController');

// Validation middleware
const validateTimeLog = [
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be less than 500 characters'),
  body('hours_spent').isFloat({ min: 0.1 }).withMessage('Hours spent must be greater than 0'),
  body('task_id').optional().isUUID().withMessage('Valid task ID is required'),
  body('project_id').optional().isUUID().withMessage('Valid project ID is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM:SS)'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM:SS)'),
  body('is_billable').optional().isBoolean().withMessage('is_billable must be a boolean')
];

const validateTimeLogUpdate = [
  body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be less than 500 characters'),
  body('hours_spent').optional().isFloat({ min: 0.1 }).withMessage('Hours spent must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM:SS)'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM:SS)'),
  body('is_billable').optional().isBoolean().withMessage('is_billable must be a boolean')
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

// POST /api/time/log - Log time entry
router.post('/log', auth, validateTimeLog, handleValidationErrors, async (req, res) => {
  try {
    const timeLog = await timeController.logTime(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Time logged successfully',
      data: timeLog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to log time',
      error: error.message
    });
  }
});

// PUT /api/time/:id - Update time log
router.put('/:id', auth, validateTimeLogUpdate, handleValidationErrors, async (req, res) => {
  try {
    const timeLog = await timeController.updateTimeLog(req.params.id, req.body, req.user.id);
    
    res.json({
      success: true,
      message: 'Time log updated successfully',
      data: timeLog
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to update time log',
      error: error.message
    });
  }
});

// DELETE /api/time/:id - Delete time log
router.delete('/:id', auth, async (req, res) => {
  try {
    await timeController.deleteTimeLog(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to delete time log',
      error: error.message
    });
  }
});

// GET /api/time/task/:taskId - Get time logs for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date } = req.query;
    const result = await timeController.getTaskTimeLogs(req.params.taskId, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date
    });
    
    res.json({
      success: true,
      data: result.time_logs,
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
      message: 'Failed to fetch time logs',
      error: error.message
    });
  }
});

// GET /api/time/project/:projectId - Get time logs for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date, user_id } = req.query;
    const result = await timeController.getProjectTimeLogs(req.params.projectId, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date,
      user_id
    });
    
    res.json({
      success: true,
      data: result.time_logs,
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
      message: 'Failed to fetch time logs',
      error: error.message
    });
  }
});

// GET /api/time/user/assigned - Get user's time logs
router.get('/user/assigned', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date, project_id, task_id } = req.query;
    const result = await timeController.getUserTimeLogs(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date,
      project_id,
      task_id
    });
    
    res.json({
      success: true,
      data: result.time_logs,
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
      message: 'Failed to fetch time logs',
      error: error.message
    });
  }
});

// GET /api/time/project/:projectId/summary - Get project time summary
router.get('/project/:projectId/summary', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const summary = await timeController.getProjectTimeSummary(req.params.projectId, req.user.id, {
      start_date,
      end_date
    });
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time summary',
      error: error.message
    });
  }
});

// GET /api/time/user/timesheet - Get user's timesheet
router.get('/user/timesheet', auth, async (req, res) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    const timesheet = await timeController.getUserTimesheet(req.user.id, {
      start_date,
      end_date,
      project_id
    });
    
    res.json({
      success: true,
      data: timesheet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timesheet',
      error: error.message
    });
  }
});

module.exports = router; 