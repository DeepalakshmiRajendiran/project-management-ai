# Troubleshooting Guide

## Common Issues and Solutions

### 1. 429 Too Many Requests Error

**Problem:** Getting `429 Too Many Requests` when trying to login or make API calls.

**Solutions:**

#### Option A: Reset Rate Limits (Development)
```bash
# Make a POST request to reset rate limits
curl -X POST http://localhost:3000/api/dev/reset-limits
```

#### Option B: Wait and Retry
- Wait 15 minutes for rate limits to reset
- Try again with fewer requests

#### Option C: Restart the Server
```bash
# Stop the server (Ctrl+C)
# Restart the server
npm run dev
```

#### Option D: Check Environment Variables
Make sure `NODE_ENV=development` is set in your `.env` file:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management_dev
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Database Connection Issues

**Problem:** Cannot connect to database or tables don't exist.

**Solutions:**

#### Test Database Connection
```bash
npm run test:db
```

#### Reset Database
```bash
# Drop and recreate database
npm run db:drop
npm run db:create

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed:all
```

#### Check PostgreSQL Service
```bash
# On Windows
net start postgresql-x64-15

# On macOS/Linux
sudo service postgresql start
# or
brew services start postgresql
```

### 3. Frontend Can't Connect to Backend

**Problem:** Frontend getting CORS errors or connection refused.

**Solutions:**

#### Check Backend is Running
```bash
# In backend directory
npm run dev
```

#### Check Port Configuration
- Backend should be running on port 3000
- Frontend should be running on port 5173
- Check `vite.config.js` proxy configuration

#### Test Backend Health
```bash
curl http://localhost:3000/health
```

### 4. Authentication Issues

**Problem:** Can't login or getting authentication errors.

**Solutions:**

#### Check Default Credentials
- **Admin:** admin@projectmanagement.com / admin123
- **Sample Users:** password123 for all sample users

#### Verify Database Has Users
```bash
npm run test:db
```

#### Check JWT Secret
Make sure `JWT_SECRET` is set in your `.env` file:
```env
JWT_SECRET=your-secret-key-here
```

### 5. Migration Issues

**Problem:** Database schema not created or migration errors.

**Solutions:**

#### Reset Everything
```bash
# Drop database
npm run db:drop

# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed:all
```

#### Check Migration Status
```bash
npx sequelize-cli db:migrate:status
```

#### Undo and Redo Migrations
```bash
# Undo all migrations
npm run db:migrate:undo:all

# Run migrations again
npm run db:migrate
```

### 6. File Upload Issues

**Problem:** Avatar uploads not working.

**Solutions:**

#### Check Upload Directory
```bash
# Create uploads directory if it doesn't exist
mkdir -p backend/uploads
```

#### Check File Permissions
```bash
# Make sure uploads directory is writable
chmod 755 backend/uploads
```

### 7. Development Environment Setup

**Complete Setup Process:**

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set Environment Variables:**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup Database:**
   ```bash
   npm run db:create
   npm run db:migrate
   npm run db:seed:all
   ```

4. **Start Backend:**
   ```bash
   npm run dev
   ```

5. **Test Backend:**
   ```bash
   npm run test:db
   curl http://localhost:3000/health
   ```

### 8. Production Issues

**Problem:** Issues in production environment.

**Solutions:**

#### Check Environment Variables
```env
NODE_ENV=production
DB_HOST=your-production-host
DB_PORT=5432
DB_NAME=project_management_prod
DB_USER=your_production_user
DB_PASSWORD=your_production_password
JWT_SECRET=your-production-secret
```

#### Run Production Migrations
```bash
NODE_ENV=production npm run db:migrate
```

#### Check Logs
```bash
# Check application logs
tail -f logs/app.log
```

### 9. Performance Issues

**Problem:** Slow API responses or high memory usage.

**Solutions:**

#### Check Database Indexes
```sql
-- Check if indexes exist
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

#### Monitor Database Performance
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Optimize Rate Limits
Adjust rate limits in `src/app.js` for your use case.

### 10. Common Error Messages

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Check if PostgreSQL is running |
| `ENOTFOUND` | Check database host/port configuration |
| `ER_ACCESS_DENIED_ERROR` | Check database credentials |
| `ER_NO_SUCH_TABLE` | Run migrations |
| `JWT_SECRET is not defined` | Set JWT_SECRET in .env |
| `CORS error` | Check CORS configuration in app.js |

### 11. Debug Mode

Enable debug logging by setting in `.env`:
```env
DEBUG=*
NODE_ENV=development
```

### 12. Getting Help

If you're still having issues:

1. Check the logs in the console
2. Run `npm run test:db` to verify database connection
3. Check if all environment variables are set correctly
4. Verify PostgreSQL is running and accessible
5. Check if the correct ports are being used

---