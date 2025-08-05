const { pool } = require('../config/database');

class TeamController {
  // Get all users
  async getAllUsers(options = {}) {
    const { page = 1, limit = 20, search, is_active, role } = options;
    const offset = (page - 1) * limit;

    console.log('getAllUsers called with options:', options);

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      whereConditions.push(`(u.username ILIKE $${++paramCount} OR u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (is_active !== undefined && is_active !== null) {
      whereConditions.push(`u.is_active = $${++paramCount}`);
      queryParams.push(is_active);
    }

    if (role) {
      whereConditions.push(`r.name = $${++paramCount}`);
      queryParams.push(role);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total users
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    console.log('Count query:', countQuery);
    console.log('Count query params:', queryParams);
    
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);
    console.log('Total users found:', totalItems);

    // Get users with their actual roles
    const usersQuery = `
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.avatar_url, u.phone, 
        u.is_active, u.is_verified, u.last_login, u.created_at,
        COALESCE(r.name, 'member') as role,
        CASE 
          WHEN u.is_active = true THEN 'active'
          ELSE 'inactive'
        END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.project_id IS NULL
      LEFT JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);
    
    console.log('Users query:', usersQuery);
    console.log('Users query params:', queryParams);

    const usersResult = await pool.query(usersQuery, queryParams);
    const users = usersResult.rows;
    console.log('Users found:', users.length);
    console.log('First user (if any):', users[0]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      users,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const query = `
      SELECT 
        u.*,
        COALESCE(r.name, 'member') as role,
        CASE 
          WHEN u.is_active = true THEN 'active'
          ELSE 'inactive'
        END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.project_id IS NULL
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get current user's role in project
  async getCurrentUserRole(projectId, userId) {
    const query = `
      SELECT role 
      FROM project_members 
      WHERE project_id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [projectId, userId]);
    
    if (result.rows.length === 0) {
      return null; // User is not a member of this project
    }

    return result.rows[0].role;
  }

  // Get project team members
  async getProjectTeam(projectId, userId) {
    console.log(`getProjectTeam called with projectId: ${projectId}, userId: ${userId}`);
    
    // First, check if user is a member of this project
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length > 0) {
      console.log(`User ${userId} is a member of project ${projectId} with role: ${memberCheck.rows[0].role}`);
    } else {
      console.log(`User ${userId} is NOT a member of project ${projectId}`);
    }
    
    // Check if user is admin (system-wide admin)
    const userRoleResult = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.project_id IS NULL
       LIMIT 1`,
      [userId]
    );
    const userRole = userRoleResult.rows.length > 0 ? userRoleResult.rows[0].name : 'user';
    console.log(`User ${userId} system role: ${userRole}`);
    
    // Allow access if user is admin OR if user is a member of the project
    if (userRole !== 'admin' && memberCheck.rows.length === 0) {
      console.log(`Access denied: User ${userId} is not admin and not a member of project ${projectId}`);
      throw new Error('Access denied to this project');
    }
    
    console.log(`Access granted: User ${userId} can view team members for project ${projectId}`);
    
    // If user is admin, they can see all team members
    // If user is a member, they can see team members for their project

    const query = `
      SELECT 
        pm.user_id, u.username, u.email, u.first_name, u.last_name, u.avatar_url, u.phone,
        u.is_active, u.is_verified, u.last_login,
        pm.role as project_role,
        pm.joined_at,
        COUNT(DISTINCT t.id) as assigned_tasks_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks_count
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.project_id = pm.project_id
      WHERE pm.project_id = $1
      GROUP BY pm.user_id, u.username, u.email, u.first_name, u.last_name, u.avatar_url, u.phone,
               u.is_active, u.is_verified, u.last_login, pm.role, pm.joined_at
      ORDER BY pm.joined_at ASC
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  // Add user to project
  async addUserToProject(projectId, userId, targetUserId, role = 'member') {
    // Check if user has permission to add team members
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0 || accessCheck.rows[0].role !== 'project_manager') {
      throw new Error('Insufficient permissions to add team members');
    }

    // Check if target user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [targetUserId]
    );
    if (userCheck.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    // Check if user is already a project member
    const existingCheck = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('User is already a member of this project');
    }

    // Validate role
    const validRoles = ['member', 'developer', 'project_manager', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const result = await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [projectId, targetUserId, role]
    );

    return result.rows[0];
  }

  // Update project member role
  async updateProjectMemberRole(projectId, userId, targetUserId, newRole) {
    // Check if user has permission to update team member roles
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0 || accessCheck.rows[0].role !== 'project_manager') {
      throw new Error('Insufficient permissions to update team member roles');
    }

    // Check if target user is a project member
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );
    if (memberCheck.rows.length === 0) {
      throw new Error('User is not a member of this project');
    }

    // Validate role
    const validRoles = ['member', 'developer', 'project_manager', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    // Prevent removing the last project manager
    if (memberCheck.rows[0].role === 'project_manager' && newRole !== 'project_manager') {
      const managerCount = await pool.query(
        'SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND role = $2',
        [projectId, 'project_manager']
      );
      if (parseInt(managerCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the last project manager');
      }
    }

    const result = await pool.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [newRole, projectId, targetUserId]
    );

    return result.rows[0];
  }

  // Remove user from project
  async removeUserFromProject(projectId, userId, targetUserId) {
    // Check if user has permission to remove team members
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0 || accessCheck.rows[0].role !== 'project_manager') {
      throw new Error('Insufficient permissions to remove team members');
    }

    // Check if target user is a project member
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );
    if (memberCheck.rows.length === 0) {
      throw new Error('User is not a member of this project');
    }

    // Prevent removing the last project manager
    if (memberCheck.rows[0].role === 'project_manager') {
      const managerCount = await pool.query(
        'SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND role = $2',
        [projectId, 'project_manager']
      );
      if (parseInt(managerCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the last project manager');
      }
    }

    // Check if user has assigned tasks
    const tasksCheck = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND assigned_to = $2 AND status NOT IN ($3, $4)',
      [projectId, targetUserId, 'completed', 'cancelled']
    );
    if (parseInt(tasksCheck.rows[0].count) > 0) {
      throw new Error('Cannot remove user with active assigned tasks. Please reassign tasks first.');
    }

    const result = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
      [projectId, targetUserId]
    );

    return result.rows[0];
  }

  // Get user's projects
  async getUserProjects(userId) {
    const query = `
      SELECT 
        p.*,
        pm.role as user_role,
        pm.joined_at,
        COUNT(DISTINCT m.id) as milestones_count,
        COUNT(DISTINCT t.id) as tasks_count,
        COUNT(DISTINCT pm2.user_id) as team_size
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      LEFT JOIN milestones m ON p.id = m.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id, pm.role, pm.joined_at
      ORDER BY p.updated_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get user's assigned tasks
  async getUserAssignedTasks(userId, options = {}) {
    const { project_id, status, priority, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['t.assigned_to = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (project_id) {
      whereConditions.push(`t.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (status) {
      whereConditions.push(`t.status = $${++paramCount}`);
      queryParams.push(status);
    }

    if (priority) {
      whereConditions.push(`t.priority = $${++paramCount}`);
      queryParams.push(priority);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count total tasks
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get tasks with project info
    const tasksQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.id as project_id,
        m.name as milestone_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN milestones m ON t.milestone_id = m.id
      WHERE ${whereClause}
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        t.due_date ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const tasksResult = await pool.query(tasksQuery, queryParams);
    const tasks = tasksResult.rows;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      tasks,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get user statistics
  async getUserStats(userId) {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM project_members WHERE user_id = $1) as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1) as total_assigned_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND due_date < CURRENT_TIMESTAMP AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
        (SELECT COALESCE(SUM(hours_spent), 0) FROM time_logs WHERE user_id = $1) as total_hours_logged
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    return statsResult.rows[0];
  }

  // Create new user
  async createUser(userData) {
    const { username, email, password_hash, first_name, last_name, avatar_url, phone, is_active = true, is_verified = false } = userData;

    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        avatar_url, phone, is_active, is_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [username, email, password_hash, first_name, last_name, avatar_url, phone, is_active, is_verified];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update user
  async updateUser(userId, updateData) {
    const { username, email, first_name, last_name, avatar_url, phone, is_active, is_verified } = updateData;

    const query = `
      UPDATE users 
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          first_name = COALESCE($3, first_name),
          last_name = COALESCE($4, last_name),
          avatar_url = COALESCE($5, avatar_url),
          phone = COALESCE($6, phone),
          is_active = COALESCE($7, is_active),
          is_verified = COALESCE($8, is_verified),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;

    const values = [username, email, first_name, last_name, avatar_url, phone, is_active, is_verified, userId];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Delete user
  async deleteUser(userId) {
    // First check if user has any active projects or tasks
    const checkQuery = `
      SELECT 
        (SELECT COUNT(*) FROM project_members WHERE user_id = $1) as project_count,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1) as task_count
    `;
    
    const checkResult = await pool.query(checkQuery, [userId]);
    const { project_count, task_count } = checkResult.rows[0];

    if (parseInt(project_count) > 0 || parseInt(task_count) > 0) {
      throw new Error('Cannot delete user with active projects or assigned tasks');
    }

    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [userId]);
    
    return result.rows.length > 0;
  }
}

module.exports = new TeamController(); 