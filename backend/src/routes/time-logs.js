const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const timeController = require('../controllers/timeController');

// Validation middleware
const validateTimeLog = [
  body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be less than 500 characters'),
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

// Test route to verify time-logs routes are working
router.get('/test-route', auth, async (req, res) => {
  console.log('✅ /test-route reached');
  res.json({
    success: true,
    message: 'Time-logs routes are working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/time-logs - Get all time logs (with pagination and filters)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date, user_id, project_id, task_id } = req.query;
    const result = await timeController.getAllTimeLogs(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date,
      user_id,
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



// POST /api/time-logs - Create new time log
router.post('/', auth, validateTimeLog, handleValidationErrors, async (req, res) => {
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

// PUT /api/time-logs/:id - Update time log
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

// DELETE /api/time-logs/:id - Delete time log
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

// GET /api/time-logs/user/:userId - Get time logs for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date, project_id, task_id } = req.query;
    const result = await timeController.getUserTimeLogs(req.params.userId, {
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
      message: 'Failed to fetch user time logs',
      error: error.message
    });
  }
});



// GET /api/time-logs/task/:taskId - Get time logs for a task
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
      message: 'Failed to fetch task time logs',
      error: error.message
    });
  }
});

// GET /api/time-logs/date/:date - Get time logs for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, user_id, project_id, task_id } = req.query;
    const result = await timeController.getTimeLogsByDate(req.params.date, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      user_id,
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
      message: 'Failed to fetch time logs for date',
      error: error.message
    });
  }
});

// GET /api/time-logs/range/:startDate/:endDate - Get time logs for a date range
router.get('/range/:startDate/:endDate', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, user_id, project_id, task_id } = req.query;
    const result = await timeController.getTimeLogsByDateRange(req.params.startDate, req.params.endDate, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      user_id,
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
      message: 'Failed to fetch time logs for date range',
      error: error.message
    });
  }
});

// Helper function to convert timeRange to start_date and end_date
const convertTimeRangeToDates = (timeRange) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (timeRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 1, Sunday is 0
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      return { start_date: null, end_date: null };
  }
  
  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  };
};

// GET /api/time-logs/summary - Get time summary
router.get('/summary', auth, async (req, res) => {
  console.log('✅ /summary route reached with query:', req.query);
  try {
    let { start_date, end_date, user_id, project_id, task_id, timeRange } = req.query;
    
    // Convert timeRange to start_date and end_date if provided
    if (timeRange && !start_date && !end_date) {
      const dateRange = convertTimeRangeToDates(timeRange);
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
      console.log('✅ Converted timeRange to dates:', { timeRange, start_date, end_date });
    }
    
    console.log('✅ Calling getTimeSummary with params:', { start_date, end_date, user_id, project_id, task_id });
    const summary = await timeController.getTimeSummary(req.user.id, {
      start_date,
      end_date,
      user_id,
      project_id,
      task_id
    });
    
    console.log('✅ getTimeSummary result:', summary);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Error in /summary route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time summary',
      error: error.message
    });
  }
});

// Test route to verify time-logs routes are working
router.get('/test', auth, async (req, res) => {
  console.log('✅ /test route reached');
  res.json({
    success: true,
    message: 'Time-logs routes are working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/time-logs/billable - Get billable hours
router.get('/billable', auth, async (req, res) => {
  try {
    let { start_date, end_date, user_id, project_id, task_id, timeRange } = req.query;
    
    // Convert timeRange to start_date and end_date if provided
    if (timeRange && !start_date && !end_date) {
      const dateRange = convertTimeRangeToDates(timeRange);
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
    }
    
    const billableHours = await timeController.getBillableHours(req.user.id, {
      start_date,
      end_date,
      user_id,
      project_id,
      task_id
    });
    
    res.json({
      success: true,
      data: billableHours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billable hours',
      error: error.message
    });
  }
});

// GET /api/time-logs/categories - Get category breakdown
router.get('/categories', auth, async (req, res) => {
  try {
    let { start_date, end_date, user_id, project_id, timeRange } = req.query;
    
    // Convert timeRange to start_date and end_date if provided
    if (timeRange && !start_date && !end_date) {
      const dateRange = convertTimeRangeToDates(timeRange);
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
    }
    
    const categories = await timeController.getCategoryBreakdown(req.user.id, {
      start_date,
      end_date,
      user_id,
      project_id
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category breakdown',
      error: error.message
    });
  }
});

// GET /api/time-logs/users - Get user breakdown
router.get('/users', auth, async (req, res) => {
  try {
    let { start_date, end_date, project_id, timeRange } = req.query;
    
    // Convert timeRange to start_date and end_date if provided
    if (timeRange && !start_date && !end_date) {
      const dateRange = convertTimeRangeToDates(timeRange);
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
    }
    
    const users = await timeController.getUserBreakdown(req.user.id, {
      start_date,
      end_date,
      project_id
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user breakdown',
      error: error.message
    });
  }
});

// GET /api/time-logs/projects - Get project breakdown
router.get('/projects', auth, async (req, res) => {
  console.log('✅ /projects route reached with query:', req.query);
  try {
    let { start_date, end_date, user_id, timeRange } = req.query;
    
    // Convert timeRange to start_date and end_date if provided
    if (timeRange && !start_date && !end_date) {
      const dateRange = convertTimeRangeToDates(timeRange);
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
      console.log('✅ Converted timeRange to dates for projects:', { timeRange, start_date, end_date });
    }
    
    console.log('✅ Calling getProjectBreakdown with params:', { start_date, end_date, user_id });
    const projects = await timeController.getProjectBreakdown(req.user.id, {
      start_date,
      end_date,
      user_id
    });
    
    console.log('✅ getProjectBreakdown result:', projects);
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('❌ Error in /projects route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project breakdown',
      error: error.message
    });
  }
});

// GET /api/time-logs/project/:projectId - Get time logs for a project
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
      message: 'Failed to fetch project time logs',
      error: error.message
    });
  }
});

// GET /api/time-logs/export - Export timesheet
router.get('/export', auth, async (req, res) => {
  try {
    const { start_date, end_date, user_id, project_id, task_id, format = 'csv' } = req.query;
    const exportData = await timeController.exportTimesheet(req.user.id, {
      start_date,
      end_date,
      user_id,
      project_id,
      task_id,
      format
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="timesheet-${start_date}-${end_date}.csv"`);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export timesheet',
      error: error.message
    });
  }
});

// GET /api/time-logs/:id - Get specific time log (must be last to avoid conflicts)
router.get('/:id', auth, async (req, res) => {
  console.log('⚠️ /:id route reached with id:', req.params.id);
  try {
    const timeLog = await timeController.getTimeLogById(req.params.id, req.user.id);
    
    res.json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    console.error('❌ Error in /:id route:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time log',
      error: error.message
    });
  }
});

module.exports = router; 