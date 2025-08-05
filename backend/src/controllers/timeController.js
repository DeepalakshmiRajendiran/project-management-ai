const { pool } = require('../config/database');

class TimeController {
  // Log time entry
  async logTime(timeData, userId) {
    const { task_id, project_id, description, hours_spent, date, start_time, end_time, is_billable } = timeData;

    // Validate that at least one entity is specified
    if (!task_id && !project_id) {
      throw new Error('Time log must be associated with a task or project');
    }

    let finalProjectId = project_id;

    // Check access based on the entity type
    if (task_id) {
      const taskQuery = await pool.query(
        'SELECT project_id FROM tasks WHERE id = $1',
        [task_id]
      );
      if (taskQuery.rows.length === 0) {
        throw new Error('Task not found');
      }

      // Get the project_id from the task
      finalProjectId = taskQuery.rows[0].project_id;

      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [finalProjectId, userId]
      );
      if (accessCheck.rows.length === 0) {
        throw new Error('Access denied to this task');
      }
    } else if (project_id) {
      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, userId]
      );
      if (accessCheck.rows.length === 0) {
        throw new Error('Access denied to this project');
      }
    }

    // Validate hours
    if (hours_spent <= 0) {
      throw new Error('Hours spent must be greater than 0');
    }

    // Validate date
    const logDate = date || new Date().toISOString().split('T')[0];
    if (new Date(logDate) > new Date()) {
      throw new Error('Cannot log time for future dates');
    }

    const result = await pool.query(
      `INSERT INTO time_logs (user_id, task_id, project_id, description, hours_spent, date, start_time, end_time, is_billable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, task_id, finalProjectId, description, hours_spent, logDate, start_time, end_time, is_billable]
    );

    return result.rows[0];
  }

  // Update time log
  async updateTimeLog(timeLogId, updateData, userId) {
    const { description, hours_spent, date, start_time, end_time, is_billable } = updateData;

    // Get time log and check ownership
    const timeLogQuery = await pool.query(
      'SELECT user_id, task_id, project_id FROM time_logs WHERE id = $1',
      [timeLogId]
    );

    if (timeLogQuery.rows.length === 0) {
      throw new Error('Time log not found');
    }

    const timeLog = timeLogQuery.rows[0];

    // Check if user owns the time log or has admin privileges
    if (timeLog.user_id !== userId) {
      // Check if user is project manager or admin
      let projectId = timeLog.project_id;
      if (timeLog.task_id) {
        const taskQuery = await pool.query(
          'SELECT project_id FROM tasks WHERE id = $1',
          [timeLog.task_id]
        );
        projectId = taskQuery.rows[0].project_id;
      }

      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
        throw new Error('Insufficient permissions to edit this time log');
      }
    }

    // Validate hours
    if (hours_spent && hours_spent <= 0) {
      throw new Error('Hours spent must be greater than 0');
    }

    // Validate date
    if (date && new Date(date) > new Date()) {
      throw new Error('Cannot log time for future dates');
    }

    const result = await pool.query(
      `UPDATE time_logs 
       SET description = COALESCE($1, description),
           hours_spent = COALESCE($2, hours_spent),
           date = COALESCE($3, date),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           is_billable = COALESCE($6, is_billable),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [description, hours_spent, date, start_time, end_time, is_billable, timeLogId]
    );

    return result.rows[0];
  }

  // Delete time log
  async deleteTimeLog(timeLogId, userId) {
    // Get time log and check ownership
    const timeLogQuery = await pool.query(
      'SELECT user_id, task_id, project_id FROM time_logs WHERE id = $1',
      [timeLogId]
    );

    if (timeLogQuery.rows.length === 0) {
      throw new Error('Time log not found');
    }

    const timeLog = timeLogQuery.rows[0];

    // Check if user owns the time log or has admin privileges
    if (timeLog.user_id !== userId) {
      // Check if user is project manager or admin
      let projectId = timeLog.project_id;
      if (timeLog.task_id) {
        const taskQuery = await pool.query(
          'SELECT project_id FROM tasks WHERE id = $1',
          [timeLog.task_id]
        );
        projectId = taskQuery.rows[0].project_id;
      }

      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
        throw new Error('Insufficient permissions to delete this time log');
      }
    }

    const result = await pool.query(
      'DELETE FROM time_logs WHERE id = $1 RETURNING id',
      [timeLogId]
    );

    return { id: timeLogId };
  }

  // Get time logs for a task
  async getTaskTimeLogs(taskId, userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date } = options;
    const offset = (page - 1) * limit;

    // Check if user has access to this task
    const taskQuery = await pool.query(
      'SELECT project_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskQuery.rows.length === 0) {
      throw new Error('Task not found');
    }

    const projectId = taskQuery.rows[0].project_id;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this task');
    }

    let whereConditions = ['tl.task_id = $1'];
    let queryParams = [taskId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count total time logs
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with user info
    const timeLogsQuery = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url
      FROM time_logs tl
      JOIN users u ON tl.user_id = u.id
      WHERE ${whereClause}
      ORDER BY tl.date DESC, tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const timeLogsResult = await pool.query(timeLogsQuery, queryParams);
    const timeLogs = timeLogsResult.rows;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: timeLogs,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get time logs for a project
  async getProjectTimeLogs(projectId, userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date, user_id } = options;
    const offset = (page - 1) * limit;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this project');
    }

    let whereConditions = ['tl.project_id = $1'];
    let queryParams = [projectId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count total time logs
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with user and task info
    const timeLogsQuery = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        t.title as task_title,
        t.id as task_id
      FROM time_logs tl
      JOIN users u ON tl.user_id = u.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.date DESC, tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const timeLogsResult = await pool.query(timeLogsQuery, queryParams);
    const timeLogs = timeLogsResult.rows;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: timeLogs,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get user's time logs
  async getUserTimeLogs(userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date, project_id, task_id } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['tl.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count total time logs
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with project and task info
    const timeLogsQuery = `
      SELECT 
        tl.*,
        p.name as project_name,
        p.id as project_id,
        t.title as task_title,
        t.id as task_id
      FROM time_logs tl
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.date DESC, tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const timeLogsResult = await pool.query(timeLogsQuery, queryParams);
    const timeLogs = timeLogsResult.rows;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: timeLogs,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get time summary for a project
  async getProjectTimeSummary(projectId, userId, options = {}) {
    const { start_date, end_date } = options;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this project');
    }

    let whereConditions = ['tl.project_id = $1'];
    let queryParams = [projectId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const summaryQuery = `
      SELECT 
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COALESCE(SUM(CASE WHEN NOT tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as non_billable_hours,
        COUNT(DISTINCT tl.user_id) as users_count,
        COUNT(DISTINCT tl.task_id) as tasks_count,
        COUNT(*) as entries_count
      FROM time_logs tl
      WHERE ${whereClause}
    `;

    const summaryResult = await pool.query(summaryQuery, queryParams);
    const summary = summaryResult.rows[0];

    // Get time breakdown by user
    const userBreakdownQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN users u ON tl.user_id = u.id
      WHERE ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.username
      ORDER BY total_hours DESC
    `;

    const userBreakdownResult = await pool.query(userBreakdownQuery, queryParams);
    summary.user_breakdown = userBreakdownResult.rows;

    // Get time breakdown by task
    const taskBreakdownQuery = `
      SELECT 
        t.id,
        t.title,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      GROUP BY t.id, t.title
      ORDER BY total_hours DESC
    `;

    const taskBreakdownResult = await pool.query(taskBreakdownQuery, queryParams);
    summary.task_breakdown = taskBreakdownResult.rows;

    return summary;
  }

  // Get all time logs with pagination and filters
  async getAllTimeLogs(userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date, user_id, project_id, task_id } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [`tl.user_id = $1`]; // Filter by current user by default
    let queryParams = [userId];
    let paramCount = 1;

    // Add additional filters
    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with pagination
    const logsQuery = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        p.name as project_name,
        t.title as task_title
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const logsResult = await pool.query(logsQuery, queryParams);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: logsResult.rows,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get time log by ID
  async getTimeLogById(timeLogId, userId) {
    const query = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        p.name as project_name,
        t.title as task_title
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE tl.id = $1
    `;

    const result = await pool.query(query, [timeLogId]);
    
    if (result.rows.length === 0) {
      throw new Error('Time log not found');
    }

    return result.rows[0];
  }

  // Get time logs by date
  async getTimeLogsByDate(date, userId, options = {}) {
    const { page = 1, limit = 20, user_id, project_id, task_id } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['tl.date = $1'];
    let queryParams = [date];
    let paramCount = 1;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with pagination
    const logsQuery = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        p.name as project_name,
        t.title as task_title
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const logsResult = await pool.query(logsQuery, queryParams);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: logsResult.rows,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get time logs by date range
  async getTimeLogsByDateRange(startDate, endDate, userId, options = {}) {
    const { page = 1, limit = 20, user_id, project_id, task_id } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['tl.date >= $1 AND tl.date <= $2'];
    let queryParams = [startDate, endDate];
    let paramCount = 2;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM time_logs tl
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get time logs with pagination
    const logsQuery = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.username,
        p.name as project_name,
        t.title as task_title
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    const logsResult = await pool.query(logsQuery, queryParams);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      time_logs: logsResult.rows,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get time summary
  async getTimeSummary(userId, options = {}) {
    const { start_date, end_date, user_id, project_id, task_id } = options;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const summaryQuery = `
      SELECT 
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as total_entries,
        COUNT(DISTINCT tl.user_id) as unique_users,
        COUNT(DISTINCT tl.project_id) as unique_projects,
        COUNT(DISTINCT tl.task_id) as unique_tasks
      FROM time_logs tl
      WHERE ${whereClause}
    `;

    const summaryResult = await pool.query(summaryQuery, queryParams);
    return summaryResult.rows[0];
  }

  // Get billable hours
  async getBillableHours(userId, options = {}) {
    const { start_date, end_date, user_id, project_id, task_id } = options;

    let whereConditions = ['tl.is_billable = true'];
    let queryParams = [];
    let paramCount = 0;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const billableQuery = `
      SELECT 
        COALESCE(SUM(tl.hours_spent), 0) as total_billable_hours,
        COUNT(*) as billable_entries,
        COUNT(DISTINCT tl.user_id) as users_with_billable_hours,
        COUNT(DISTINCT tl.project_id) as projects_with_billable_hours
      FROM time_logs tl
      WHERE ${whereClause}
    `;

    const billableResult = await pool.query(billableQuery, queryParams);
    return billableResult.rows[0];
  }

  // Get category breakdown
  async getCategoryBreakdown(userId, options = {}) {
    const { start_date, end_date, user_id, project_id } = options;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const categoryQuery = `
      SELECT 
        CASE 
          WHEN tl.task_id IS NOT NULL THEN 'Task'
          WHEN tl.project_id IS NOT NULL THEN 'Project'
          ELSE 'General'
        END as category,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total_hours DESC
    `;

    const categoryResult = await pool.query(categoryQuery, queryParams);
    return categoryResult.rows;
  }

  // Get user breakdown
  async getUserBreakdown(userId, options = {}) {
    const { start_date, end_date, project_id } = options;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const userQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN users u ON tl.user_id = u.id
      WHERE ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.username
      ORDER BY total_hours DESC
    `;

    const userResult = await pool.query(userQuery, queryParams);
    return userResult.rows;
  }

  // Get project breakdown
  async getProjectBreakdown(userId, options = {}) {
    const { start_date, end_date, user_id } = options;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const projectQuery = `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN projects p ON tl.project_id = p.id
      WHERE ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY total_hours DESC
    `;

    const projectResult = await pool.query(projectQuery, queryParams);
    return projectResult.rows;
  }

  // Export timesheet
  async exportTimesheet(userId, options = {}) {
    const { start_date, end_date, user_id, project_id, task_id, format = 'csv' } = options;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (user_id) {
      whereConditions.push(`tl.user_id = $${++paramCount}`);
      queryParams.push(user_id);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    if (task_id) {
      whereConditions.push(`tl.task_id = $${++paramCount}`);
      queryParams.push(task_id);
    }

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const exportQuery = `
      SELECT 
        tl.date,
        u.first_name,
        u.last_name,
        p.name as project_name,
        t.title as task_title,
        tl.description,
        tl.hours_spent,
        tl.is_billable,
        tl.created_at
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN projects p ON tl.project_id = p.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE ${whereClause}
      ORDER BY tl.date DESC, tl.created_at DESC
    `;

    const exportResult = await pool.query(exportQuery, queryParams);

    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Date', 'User', 'Project', 'Task', 'Description', 'Hours', 'Billable', 'Created At'];
      const csvRows = [headers.join(',')];

      exportResult.rows.forEach(row => {
        const csvRow = [
          row.date,
          `"${row.first_name} ${row.last_name}"`,
          `"${row.project_name || ''}"`,
          `"${row.task_title || ''}"`,
          `"${row.description || ''}"`,
          row.hours_spent,
          row.is_billable ? 'Yes' : 'No',
          row.created_at
        ];
        csvRows.push(csvRow.join(','));
      });

      return csvRows.join('\n');
    }

    return exportResult.rows;
  }

  // Get user's timesheet
  async getUserTimesheet(userId, options = {}) {
    const { start_date, end_date, project_id } = options;

    let whereConditions = ['tl.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`tl.date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`tl.date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    if (project_id) {
      whereConditions.push(`tl.project_id = $${++paramCount}`);
      queryParams.push(project_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get daily breakdown
    const dailyQuery = `
      SELECT 
        tl.date,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      WHERE ${whereClause}
      GROUP BY tl.date
      ORDER BY tl.date DESC
    `;

    const dailyResult = await pool.query(dailyQuery, queryParams);

    // Get project breakdown
    const projectQuery = `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN projects p ON tl.project_id = p.id
      WHERE ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY total_hours DESC
    `;

    const projectResult = await pool.query(projectQuery, queryParams);

    // Get task breakdown
    const taskQuery = `
      SELECT 
        t.id,
        t.title,
        p.name as project_name,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COALESCE(SUM(CASE WHEN tl.is_billable THEN tl.hours_spent ELSE 0 END), 0) as billable_hours,
        COUNT(*) as entries_count
      FROM time_logs tl
      JOIN tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE ${whereClause}
      GROUP BY t.id, t.title, p.name
      ORDER BY total_hours DESC
    `;

    const taskResult = await pool.query(taskQuery, queryParams);

    return {
      daily_breakdown: dailyResult.rows,
      project_breakdown: projectResult.rows,
      task_breakdown: taskResult.rows
    };
  }
}

module.exports = new TimeController(); 