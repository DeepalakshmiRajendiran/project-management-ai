const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

// Validation middleware
const validateCreateInvitation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['member', 'developer', 'project_manager', 'viewer']).withMessage('Invalid role'),
  body('project_id').optional().isUUID().withMessage('Valid project ID is required'),
];

const validateAcceptInvitation = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

// POST /api/invitations - Create new invitation
router.post('/', auth, validateCreateInvitation, handleValidationErrors, async (req, res) => {
  try {
    const invitation = await invitationController.createInvitation({
      ...req.body,
      invited_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to send invitation',
      error: error.message
    });
  }
});

// GET /api/invitations - Get all invitations
router.get('/', auth, async (req, res) => {
  try {
    const { status, email, limit = 20, offset = 0 } = req.query;
    const invitations = await invitationController.getAllInvitations({
      status,
      email,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message
    });
  }
});

// GET /api/invitations/:id - Get invitation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const invitation = await invitationController.getInvitationById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.json({
      success: true,
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message
    });
  }
});

// POST /api/invitations/:id/accept - Accept invitation
router.post('/:id/accept', validateAcceptInvitation, handleValidationErrors, async (req, res) => {
  try {
    console.log('Accept invitation request:', { invitationId: req.params.id, userData: req.body });
    
    const invitation = await invitationController.getInvitationById(req.params.id);
    
    if (!invitation) {
      console.log('Invitation not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    console.log('Found invitation:', { id: invitation.id, status: invitation.status, expires_at: invitation.expires_at });
    
    if (invitation.status !== 'pending') {
      console.log('Invitation already processed:', invitation.status);
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been processed'
      });
    }
    
    if (new Date() > new Date(invitation.expires_at)) {
      console.log('Invitation expired:', invitation.expires_at);
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }
    
    const result = await invitationController.acceptInvitation(invitation.token, req.body);
    
    console.log('Invitation accepted successfully:', result);
    
    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in accept invitation route:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
});

// POST /api/invitations/:id/decline - Decline invitation
router.post('/:id/decline', async (req, res) => {
  try {
    const invitation = await invitationController.getInvitationById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    await invitationController.declineInvitation(invitation.token);
    
    res.json({
      success: true,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to decline invitation',
      error: error.message
    });
  }
});

// POST /api/invitations/:id/resend - Resend invitation
router.post('/:id/resend', auth, async (req, res) => {
  try {
    const result = await invitationController.resendInvitation(req.params.id);
    
    res.json({
      success: true,
      message: 'Invitation resent successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message
    });
  }
});

// DELETE /api/invitations/:id - Cancel invitation
router.delete('/:id', auth, async (req, res) => {
  try {
    await invitationController.cancelInvitation(req.params.id);
    
    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
});

// POST /api/invitations/bulk - Bulk invite users
router.post('/bulk', auth, async (req, res) => {
  try {
    const { invitations } = req.body;
    
    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invitations array is required'
      });
    }
    
    // Add invited_by to each invitation
    const invitationsWithInviter = invitations.map(invitation => ({
      ...invitation,
      invited_by: req.user.id
    }));
    
    const results = await invitationController.bulkInviteUsers(invitationsWithInviter);
    
    res.status(201).json({
      success: true,
      message: 'Bulk invitations processed',
      data: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to process bulk invitations',
      error: error.message
    });
  }
});

// GET /api/invitations/token/:token - Get invitation by token (public endpoint)
router.get('/token/:token', async (req, res) => {
  try {
    const invitation = await invitationController.getInvitationByToken(req.params.token);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }
    
    res.json({
      success: true,
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message
    });
  }
});

// POST /api/invitations/test-email - Test email service (development only)
router.post('/test-email', auth, async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'Test endpoint only available in development'
    });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailService = require('../services/emailService');
    const info = await emailService.sendTestEmail(email);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        messageId: info.messageId,
        previewURL: info.previewURL // Ethereal email provides this
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router; 