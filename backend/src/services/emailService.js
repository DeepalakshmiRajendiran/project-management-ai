const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, use a test account or configure SMTP
    if (process.env.NODE_ENV === 'development') {
      // Use ethereal email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'test123'
        }
      });
    } else {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async sendInvitationEmail(invitation) {
    try {
      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite?token=${invitation.token}`;
      
      const html = this.generateInvitationEmailHTML(invitation, invitationLink);
      const text = this.generateInvitationEmailText(invitation, invitationLink);

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@projectmanagement.com',
        to: invitation.email,
        subject: 'You have been invited to join our project management platform',
        html: html,
        text: text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Invitation email sent successfully', {
        messageId: info.messageId,
        to: invitation.email,
        invitationId: invitation.id
      });

      return info;
    } catch (error) {
      logger.error('Failed to send invitation email', {
        error: error.message,
        invitationId: invitation.id,
        email: invitation.email
      });
      throw error;
    }
  }

  generateInvitationEmailHTML(invitation, invitationLink) {
    const projectInfo = invitation.project_name 
      ? `<li><strong>Project:</strong> ${invitation.project_name}</li>` 
      : '';
    
    const expiresDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .details ul { list-style: none; padding: 0; }
          .details li { padding: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You've been invited!</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>You have been invited to join our project management platform.</p>
            
            <div class="details">
              <h3>Invitation Details:</h3>
              <ul>
                <li><strong>Role:</strong> ${invitation.role}</li>
                ${projectInfo}
                <li><strong>Expires:</strong> ${expiresDate}</li>
              </ul>
            </div>
            
            <p>Click the button below to accept the invitation and create your account:</p>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">
                Accept Invitation
              </a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Or copy this link: <a href="${invitationLink}">${invitationLink}</a>
            </p>
            
            <p style="margin-top: 20px; color: #dc3545;">
              ⚠️ This invitation will expire in 7 days.
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have any questions, please contact your project administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateInvitationEmailText(invitation, invitationLink) {
    const projectInfo = invitation.project_name 
      ? `Project: ${invitation.project_name}\n` 
      : '';
    
    const expiresDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
You've been invited!

Hello,

You have been invited to join our project management platform.

Invitation Details:
- Role: ${invitation.role}
${projectInfo}- Expires: ${expiresDate}

To accept this invitation, please visit:
${invitationLink}

This invitation will expire in 7 days.

If you have any questions, please contact your project administrator.

This is an automated message. Please do not reply to this email.
    `.trim();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error: error.message });
      return false;
    }
  }

  async sendTestEmail(to) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@projectmanagement.com',
        to: to,
        subject: 'Test Email - Project Management System',
        text: 'This is a test email to verify the email service is working correctly.',
        html: '<h1>Test Email</h1><p>This is a test email to verify the email service is working correctly.</p>'
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Test email sent successfully', { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Failed to send test email', { error: error.message });
      throw error;
    }
  }
}

module.exports = new EmailService(); 