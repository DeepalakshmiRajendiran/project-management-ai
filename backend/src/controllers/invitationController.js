const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const emailService = require('../services/emailService');

class InvitationController {
  // Create a new invitation
  async createInvitation(inviteData) {
    const { email, role = 'member', project_id, invited_by } = inviteData;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Check if invitation already exists for this email
    const existingInvitation = await pool.query(
      'SELECT id FROM invitations WHERE email = $1 AND status = $2',
      [email, 'pending']
    );
    
    if (existingInvitation.rows.length > 0) {
      throw new Error('Invitation already sent to this email');
    }
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const result = await pool.query(
      `INSERT INTO invitations (id, email, role, project_id, invited_by, token, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), email, role, project_id, invited_by, token, 'pending', expires_at]
    );
    
    const invitation = result.rows[0];
    
    // Send invitation email
    try {
      await emailService.sendInvitationEmail(invitation);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't fail the invitation creation if email fails
      // The invitation is still created and can be resent later
    }
    
    return invitation;
  }
  
  // Get all invitations
  async getAllInvitations(filters = {}) {
    let query = `
      SELECT i.*, 
             u.first_name as inviter_first_name, 
             u.last_name as inviter_last_name,
             p.name as project_name
      FROM invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (filters.status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.email) {
      paramCount++;
      query += ` AND i.email ILIKE $${paramCount}`;
      params.push(`%${filters.email}%`);
    }
    
    if (filters.invited_by) {
      paramCount++;
      query += ` AND i.invited_by = $${paramCount}`;
      params.push(filters.invited_by);
    }
    
    query += ` ORDER BY i.created_at DESC`;
    
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Get invitation by ID
  async getInvitationById(id) {
    const result = await pool.query(
      `SELECT i.*, 
              u.first_name as inviter_first_name, 
              u.last_name as inviter_last_name,
              p.name as project_name
       FROM invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       LEFT JOIN projects p ON i.project_id = p.id
       WHERE i.id = $1`,
      [id]
    );
    
    return result.rows[0];
  }
  
  // Get invitation by token
  async getInvitationByToken(token) {
    const result = await pool.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
      [token, 'pending']
    );
    
    return result.rows[0];
  }
  
  // Accept invitation
  async acceptInvitation(token, userData) {
    try {
      const invitation = await this.getInvitationByToken(token);
      
      if (!invitation) {
        throw new Error('Invalid or expired invitation token');
      }
      
      console.log('Accepting invitation:', { invitationId: invitation.id, email: invitation.email });
      
      // Use transaction to ensure data consistency
      const { executeTransaction } = require('../config/database');
      
      const result = await executeTransaction(async (client) => {
        // Create new user
        const userId = uuidv4();
        const hashedPassword = await require('bcryptjs').hash(userData.password, 10);
        
        console.log('Creating user:', { userId, email: invitation.email, username: userData.username });
        
        await client.query(
          `INSERT INTO users (id, email, username, first_name, last_name, password_hash, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [userId, invitation.email, userData.username, userData.first_name, userData.last_name, hashedPassword, true]
        );
        
        // Update invitation status
        console.log('Updating invitation status to accepted');
        await client.query(
          'UPDATE invitations SET status = $1, accepted_at = NOW(), updated_at = NOW() WHERE id = $2',
          ['accepted', invitation.id]
        );
        
        // If invitation was for a specific project, add user to project
        if (invitation.project_id) {
          console.log('Adding user to project:', { projectId: invitation.project_id, role: invitation.role });
          await client.query(
            `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [uuidv4(), invitation.project_id, userId, invitation.role]
          );
        } else {
          console.log('No project_id in invitation, user will not be added to any project');
        }
        
        return { success: true, user_id: userId };
      });
      
      console.log('Invitation accepted successfully:', result);
      return result;
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
  
  // Decline invitation
  async declineInvitation(token) {
    const invitation = await this.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }
    
    await pool.query(
      'UPDATE invitations SET status = $1, declined_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['declined', invitation.id]
    );
    
    return { success: true };
  }
  
  // Resend invitation
  async resendInvitation(id) {
    const invitation = await this.getInvitationById(id);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error('Can only resend pending invitations');
    }
    
    // Generate new token and extend expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await pool.query(
      'UPDATE invitations SET token = $1, expires_at = $2, updated_at = NOW() WHERE id = $3',
      [newToken, expires_at, id]
    );
    
    return { success: true, token: newToken };
  }
  
  // Cancel invitation
  async cancelInvitation(id) {
    const invitation = await this.getInvitationById(id);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error('Can only cancel pending invitations');
    }
    
    await pool.query(
      'UPDATE invitations SET status = $1, cancelled_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    );
    
    return { success: true };
  }
  
  // Bulk invite users
  async bulkInviteUsers(invitations) {
    const results = [];
    
    for (const invitation of invitations) {
      try {
        const result = await this.createInvitation(invitation);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new InvitationController(); 