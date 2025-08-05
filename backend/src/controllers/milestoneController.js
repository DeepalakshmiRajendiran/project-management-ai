const { pool } = require('../config/database');

class MilestoneController {
  // Get all milestones for a project
  async getProjectMilestones(projectId, userId) {
    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this project');
    }

    const query = `
      SELECT 
        m.*,
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
        COUNT(t.id) as tasks_count,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_tasks_count,
        COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
      FROM milestones m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN tasks t ON m.id = t.milestone_id
      WHERE m.project_id = $1
      GROUP BY m.id, u.first_name, u.last_name, u.username
      ORDER BY m.due_date ASC, m.created_at ASC
    `;

    const result = await pool.query(query, [projectId]);
    const milestones = result.rows;

    // Calculate progress for each milestone
    for (let milestone of milestones) {
      const calculatedProgress = milestone.tasks_count > 0 
        ? Math.round((milestone.completed_tasks_count / milestone.tasks_count) * 100)
        : 0;
      
      console.log(`Milestone ${milestone.name}: tasks_count=${milestone.tasks_count}, completed_tasks_count=${milestone.completed_tasks_count}, calculatedProgress=${calculatedProgress}`)
      
      milestone.progress_percentage = calculatedProgress;
      milestone.completion_percentage = calculatedProgress;
      
      // Update the database with the calculated progress
      const currentCompletion = milestone.completion_percentage || 0
      if (currentCompletion !== calculatedProgress) {
        await pool.query(
          'UPDATE milestones SET completion_percentage = $1 WHERE id = $2',
          [calculatedProgress, milestone.id]
        );
      }
    }

    return milestones;
  }

  // Get milestone by ID
  async getMilestoneById(milestoneId, userId) {
    const query = `
      SELECT 
        m.*,
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
        p.name as project_name,
        p.id as project_id
      FROM milestones m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.id = $1
    `;

    const result = await pool.query(query, [milestoneId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const milestone = result.rows[0];

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [milestone.project_id, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this milestone');
    }

    // Get tasks for this milestone
    const tasksQuery = `
      SELECT 
        t.*,
        u.first_name as assigned_first_name,
        u.last_name as assigned_last_name,
        u.username as assigned_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.milestone_id = $1
      ORDER BY t.priority DESC, t.due_date ASC
    `;
    const tasksResult = await pool.query(tasksQuery, [milestoneId]);
    milestone.tasks = tasksResult.rows;

    return milestone;
  }

  // Create new milestone
  async createMilestone(milestoneData, userId) {
    const { project_id, name, description, status, due_date, completion_percentage } = milestoneData;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [project_id, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this project');
    }

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [project_id]
    );
    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found');
    }

    const result = await pool.query(
      `INSERT INTO milestones (project_id, name, description, status, due_date, completion_percentage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [project_id, name, description, status, due_date, completion_percentage, userId]
    );

    return result.rows[0];
  }

  // Update milestone
  async updateMilestone(milestoneId, updateData, userId) {
    const { name, description, status, due_date, completion_percentage } = updateData;

    // Get milestone and check access
    const milestoneQuery = await pool.query(
      'SELECT project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );

    if (milestoneQuery.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const projectId = milestoneQuery.rows[0].project_id;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this milestone');
    }

    const result = await pool.query(
      `UPDATE milestones 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           due_date = COALESCE($4, due_date),
           completion_percentage = COALESCE($5, completion_percentage),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, status, due_date, completion_percentage, milestoneId]
    );

    return result.rows[0];
  }

  // Update milestone status
  async updateMilestoneStatus(milestoneId, status, userId) {
    // Get milestone and check access
    const milestoneQuery = await pool.query(
      'SELECT project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );

    if (milestoneQuery.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const projectId = milestoneQuery.rows[0].project_id;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this milestone');
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const result = await pool.query(
      `UPDATE milestones 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, milestoneId]
    );

    return result.rows[0];
  }

  // Delete milestone
  async deleteMilestone(milestoneId, userId) {
    // Get milestone and check access
    const milestoneQuery = await pool.query(
      'SELECT project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );

    if (milestoneQuery.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const projectId = milestoneQuery.rows[0].project_id;

    // Check if user has permission to delete this milestone
    const accessCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
      throw new Error('Insufficient permissions to delete this milestone');
    }

    // Check if milestone has tasks
    const tasksCheck = await pool.query(
      'SELECT COUNT(*) as task_count FROM tasks WHERE milestone_id = $1',
      [milestoneId]
    );

    if (parseInt(tasksCheck.rows[0].task_count) > 0) {
      throw new Error('Cannot delete milestone with associated tasks. Please reassign or delete tasks first.');
    }

    const result = await pool.query(
      'DELETE FROM milestones WHERE id = $1 RETURNING id',
      [milestoneId]
    );

    return { id: milestoneId };
  }

  // Get milestone statistics
  async getMilestoneStats(milestoneId, userId) {
    // Get milestone and check access
    const milestoneQuery = await pool.query(
      'SELECT project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );

    if (milestoneQuery.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const projectId = milestoneQuery.rows[0].project_id;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this milestone');
    }

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM tasks WHERE milestone_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE milestone_id = $1 AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE milestone_id = $1 AND status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE milestone_id = $1 AND status = 'todo') as todo_tasks,
        (SELECT COALESCE(SUM(estimated_hours), 0) FROM tasks WHERE milestone_id = $1) as total_estimated_hours,
        (SELECT COALESCE(SUM(actual_hours), 0) FROM tasks WHERE milestone_id = $1) as total_actual_hours,
        (SELECT COUNT(*) FROM comments WHERE milestone_id = $1) as total_comments,
        (SELECT COUNT(*) FROM attachments WHERE milestone_id = $1) as total_attachments
    `;

    const statsResult = await pool.query(statsQuery, [milestoneId]);
    return statsResult.rows[0];
  }

  // Get overdue milestones
  async getOverdueMilestones(userId) {
    const query = `
      SELECT 
        m.*,
        p.name as project_name,
        p.id as project_id,
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
        END as created_by_name
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE pm.user_id = $1 
        AND m.due_date < CURRENT_DATE 
        AND m.status NOT IN ('completed', 'cancelled')
      ORDER BY m.due_date ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get upcoming milestones
  async getUpcomingMilestones(userId, days = 7) {
    const query = `
      SELECT 
        m.*,
        p.name as project_name,
        p.id as project_id,
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
        END as created_by_name
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE pm.user_id = $1 
        AND m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        AND m.status NOT IN ('completed', 'cancelled')
      ORDER BY m.due_date ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = new MilestoneController(); 