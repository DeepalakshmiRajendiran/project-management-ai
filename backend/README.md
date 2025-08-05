# Project Management Backend

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@projectmanagement.com

# Development Email (Ethereal Email for testing)
ETHEREAL_USER=test@ethereal.email
ETHEREAL_PASS=test123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Email Setup

### For Development (Testing)
The system uses Ethereal Email for testing. No setup required.

### For Production
1. Set up SMTP credentials (Gmail, SendGrid, etc.)
2. Update the environment variables with your SMTP settings
3. Test the email service using the test endpoint

## Installation

```bash
npm install
npm run db:migrate
npm start
```

## API Endpoints

### Invitations
- `POST /api/invitations` - Create invitation
- `GET /api/invitations` - Get all invitations
- `POST /api/invitations/:id/accept` - Accept invitation
- `POST /api/invitations/:id/decline` - Decline invitation
- `POST /api/invitations/:id/resend` - Resend invitation
- `GET /api/invitations/token/:token` - Get invitation by token
- `POST /api/invitations/test-email` - Test email service (dev only) 