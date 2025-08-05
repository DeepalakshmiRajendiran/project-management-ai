const { pool } = require('../config/database');

class ProjectController {
  // Get all projects with pagination and filtering
  async getAllProjects(userId, options = {}) {
    const { page = 1, limit = 10, status, priority, search } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Check if user is admin or has access to projects
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'admin') {
      // For non-admin users, only show projects they're members of
      whereConditions.push(`p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $${++paramCount}
      )`);
      queryParams.push(userId);
    }

    if (status) {
      whereConditions.push(`p.status = $${++paramCount}`);
      queryParams.push(status);
    }

    if (priority) {
      whereConditions.push(`p.priority = $${++paramCount}`);
      queryParams.push(priority);
    }

    if (search) {
      whereConditions.push(`(p.name ILIKE $${++paramCount} OR p.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total projects
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get projects with related data
    const projectsQuery = `
      SELECT 
        p.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        u.username as creator_username,
        CASE 
          WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
          THEN u.first_name || ' ' || u.last_name
          WHEN u.first_name IS NOT NULL 
          THEN u.first_name
          WHEN u.username IS NOT NULL 
          THEN u.username
          ELSE 'Unknown'
        END as created_by_name,
        COUNT(DISTINCT m.id) as milestones_count,
        COUNT(DISTINCT t.id) as tasks_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as team_size,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_tasks_count,
        COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
        (SELECT COALESCE(SUM(tl.hours_spent), 0) 
         FROM time_logs tl 
         INNER JOIN tasks task ON tl.task_id = task.id 
         WHERE task.project_id = p.id) as total_time_spent
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN milestones m ON p.id = m.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      ${whereClause}
      GROUP BY p.id, u.first_name, u.last_name, u.username
      ORDER BY p.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const projectsResult = await pool.query(projectsQuery, queryParams);
    const projects = projectsResult.rows;
    
    // Get unique team members count across all projects
    const uniqueTeamMembersQuery = `
      SELECT COUNT(DISTINCT pm.user_id) as unique_team_members
      FROM project_members pm
      INNER JOIN projects p ON pm.project_id = p.id
      ${whereClause}
    `;
    const uniqueTeamResult = await pool.query(uniqueTeamMembersQuery, queryParams.slice(0, -2)); // Remove limit and offset
    const uniqueTeamMembers = parseInt(uniqueTeamResult.rows[0]?.unique_team_members) || 0;
    
    // Debug logging
    console.log('Projects query result:', projects.map(p => ({ 
      id: p.id, 
      name: p.name, 
      team_size: p.team_size,
      tasks_count: p.tasks_count,
      completed_tasks_count: p.completed_tasks_count,
      total_estimated_hours: p.total_estimated_hours,
      total_time_spent: p.total_time_spent,
      progress_percentage: p.progress_percentage
    })));
    console.log('Unique team members across all projects:', uniqueTeamMembers);

    // Calculate progress for each project
    for (let project of projects) {
      // Convert string values to numbers
      const totalEstimatedHours = parseFloat(project.total_estimated_hours) || 0;
      const totalTimeSpent = parseFloat(project.total_time_spent) || 0;
      const tasksCount = parseInt(project.tasks_count) || 0;
      const completedTasksCount = parseInt(project.completed_tasks_count) || 0;
      const teamSize = parseInt(project.team_size) || 0;

      console.log(`Project ${project.name}: tasks_count=${project.tasks_count} (parsed: ${tasksCount}), team_size=${project.team_size} (parsed: ${teamSize})`);

      // Calculate progress based on time tracking if available
      let progressPercentage = 0;
      if (totalEstimatedHours > 0) {
        progressPercentage = Math.min(Math.round((totalTimeSpent / totalEstimatedHours) * 100), 100);
      } else if (tasksCount > 0) {
        progressPercentage = Math.round((completedTasksCount / tasksCount) * 100);
      }

      // Update project object with parsed values
      project.total_estimated_hours = totalEstimatedHours;
      project.total_time_spent = totalTimeSpent;
      project.tasks_count = tasksCount;
      project.completed_tasks_count = completedTasksCount;
      project.team_size = teamSize;
      project.progress_percentage = progressPercentage;
    }

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      projects,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev,
      uniqueTeamMembers
    };
  }

  // Get project by ID with all related data
  async getProjectById(projectId, userId) {
    const userRole = await this.getUserRole(userId);
    
    // Check if user has access to this project
    if (userRole !== 'admin') {
      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0) {
        return null;
      }
    }

    // Get project details
    const projectQuery = `
      SELECT 
        p.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        u.username as creator_username,
        CASE 
          WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
          THEN u.first_name || ' ' || u.last_name
          WHEN u.first_name IS NOT NULL 
          THEN u.first_name
          WHEN u.username IS NOT NULL 
          THEN u.username
          ELSE 'Unknown'
        END as created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;
    const projectResult = await pool.query(projectQuery, [projectId]);
    
    if (projectResult.rows.length === 0) {
      return null;
    }

    const project = projectResult.rows[0];

    // Get milestones
    const milestonesQuery = `
      SELECT 
        m.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        CASE 
          WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
          THEN u.first_name || ' ' || u.last_name
          WHEN u.first_name IS NOT NULL 
          THEN u.first_name
          WHEN u.username IS NOT NULL 
          THEN u.username
          ELSE 'Unknown'
        END as created_by_name,
        COUNT(t.id) as tasks_count,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_tasks_count
      FROM milestones m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN tasks t ON m.id = t.milestone_id
      WHERE m.project_id = $1
      GROUP BY m.id, u.first_name, u.last_name, u.username
      ORDER BY m.due_date ASC
    `;
    const milestonesResult = await pool.query(milestonesQuery, [projectId]);
    project.milestones = milestonesResult.rows;

    // Get team members
    const teamQuery = `
      SELECT 
        u.id, u.username, u.first_name, u.last_name, u.avatar_url, u.email,
        pm.role as project_role,
        pm.joined_at,
        array_agg(DISTINCT r.name) as global_roles
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE pm.project_id = $1
      GROUP BY u.id, u.username, u.first_name, u.last_name, u.avatar_url, u.email, pm.role, pm.joined_at
      ORDER BY pm.joined_at ASC
    `;
    const teamResult = await pool.query(teamQuery, [projectId]);
    project.team_members = teamResult.rows.map(member => ({
      ...member,
      global_roles: member.global_roles.filter(role => role !== null)
    }));

    // Get tasks summary with time tracking
    const tasksQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_tasks,
        COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(hours_spent), 0) FROM time_logs WHERE task_id = tasks.id)
        ), 0) as total_time_spent
      FROM tasks
      WHERE project_id = $1
    `;
    const tasksResult = await pool.query(tasksQuery, [projectId]);
    project.tasks_summary = tasksResult.rows[0];

    // Calculate overall progress
    console.log('Project tasks summary:', project.tasks_summary);
    
    // Convert string values to numbers
    const totalEstimatedHours = parseFloat(project.tasks_summary.total_estimated_hours) || 0;
    const totalTimeSpent = parseFloat(project.tasks_summary.total_time_spent) || 0;
    const totalTasks = parseInt(project.tasks_summary.total_tasks) || 0;
    const completedTasks = parseInt(project.tasks_summary.completed_tasks) || 0;
    
    if (totalEstimatedHours > 0) {
      if (totalTimeSpent > 0) {
        // Use time-based progress if there are estimated hours and time spent
        project.progress_percentage = Math.min(
          Math.round((totalTimeSpent / totalEstimatedHours) * 100),
          100
        );
        console.log(`Using time-based progress: ${project.progress_percentage}%`);
      } else {
        // No time logged yet, but we have estimated hours
        project.progress_percentage = 0;
        console.log(`No time logged yet, progress: 0%`);
      }
    } else {
      // Fallback to task completion-based progress
      project.progress_percentage = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
      console.log(`Using task-based progress: ${project.progress_percentage}%`);
    }

    return project;
  }

  // Create new project
  async createProject(projectData, userId) {
    console.log(`createProject called - User ID: ${userId}, Project data:`, projectData);
    
    const { name, description, status, priority, start_date, end_date, budget } = projectData;

    const result = await pool.query(
      `INSERT INTO projects (name, description, status, priority, start_date, end_date, budget, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget, userId]
    );

    const project = result.rows[0];
    console.log(`Project created with ID: ${project.id}`);

    // Add creator as project member
    try {
      const memberResult = await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [project.id, userId, 'project_manager']
      );
      console.log(`User ${userId} added as project_manager to project ${project.id}`);
    } catch (error) {
      console.error('Error adding user as project member:', error);
      throw error;
    }

    return project;
  }

  // Update project
  async updateProject(projectId, updateData, userId) {
    const userRole = await this.getUserRole(userId);
    
    // Check if user has permission to update this project
    if (userRole !== 'admin') {
      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
        throw new Error('Insufficient permissions to update this project');
      }
    }

    const { name, description, status, priority, start_date, end_date, budget } = updateData;
    
    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           budget = COALESCE($7, budget),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget, projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return result.rows[0];
  }

  // Delete project
  async deleteProject(projectId, userId) {
    const userRole = await this.getUserRole(userId);
    
    // Check if user has permission to delete this project
    if (userRole !== 'admin') {
      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || accessCheck.rows[0].role !== 'project_manager') {
        throw new Error('Insufficient permissions to delete this project');
      }
    }

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return { id: projectId };
  }

  // Get user role
  async getUserRole(userId) {
    const result = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.project_id IS NULL
       LIMIT 1`,
      [userId]
    );
    
    return result.rows.length > 0 ? result.rows[0].name : 'user';
  }

  // Get project statistics
  async getProjectStats(projectId, userId) {
    const userRole = await this.getUserRole(userId);
    
    // Check if user has access to this project
    if (userRole !== 'admin') {
      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0) {
        return null;
      }
    }

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM milestones WHERE project_id = $1) as totalMilestones,
        (SELECT COUNT(*) FROM milestones WHERE project_id = $1 AND status = 'completed') as completedMilestones,
        (SELECT COUNT(*) FROM tasks WHERE project_id = $1) as totalTasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed') as completedTasks,
        (SELECT COUNT(*) FROM project_members WHERE project_id = $1) as teamSize,
        (SELECT COALESCE(SUM(tl.hours_spent), 0) 
         FROM time_logs tl 
         INNER JOIN tasks t ON tl.task_id = t.id 
         WHERE t.project_id = $1) as totalHours,
        (SELECT COUNT(*) FROM comments WHERE project_id = $1) as totalComments,
        (SELECT COUNT(*) FROM attachments WHERE project_id = $1) as totalAttachments
    `;
    
    const statsResult = await pool.query(statsQuery, [projectId]);
    const stats = statsResult.rows[0];
    
    console.log('Project stats for project', projectId, ':', {
      totalMilestones: stats.totalMilestones,
      completedMilestones: stats.completedMilestones,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      teamSize: stats.teamSize,
      totalHours: stats.totalHours,
      totalComments: stats.totalComments,
      totalAttachments: stats.totalAttachments
    });
    
    return stats;
  }
}

module.exports = new ProjectController(); 