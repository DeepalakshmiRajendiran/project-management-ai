const { pool } = require('../config/database');

class CommentController {
  // Get comments for a task
  async getTaskComments(taskId, userId, options = {}) {
    const { page = 1, limit = 20 } = options;
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

    // Count total comments
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE task_id = $1
    `;
    const countResult = await pool.query(countQuery, [taskId]);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get comments with user info and attachments
    const commentsQuery = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        COUNT(a.id) as attachments_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN attachments a ON c.id = a.comment_id
      WHERE c.task_id = $1
      GROUP BY c.id, u.first_name, u.last_name, u.username, u.avatar_url
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const commentsResult = await pool.query(commentsQuery, [taskId, limit, offset]);
    const comments = commentsResult.rows;

    // Get attachments for each comment
    for (let comment of comments) {
      const attachmentsQuery = `
        SELECT id, filename, original_filename, file_size, mime_type, created_at
        FROM attachments
        WHERE comment_id = $1
        ORDER BY created_at ASC
      `;
      const attachmentsResult = await pool.query(attachmentsQuery, [comment.id]);
      comment.attachments = attachmentsResult.rows;
    }

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      comments,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Get comments for a project
  async getProjectComments(projectId, userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Check if user has access to this project
    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this project');
    }

    // Count total comments
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE project_id = $1
    `;
    const countResult = await pool.query(countQuery, [projectId]);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get comments with user info
    const commentsQuery = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        t.title as task_title,
        t.id as task_id,
        COUNT(a.id) as attachments_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN attachments a ON c.id = a.comment_id
      WHERE c.project_id = $1
      GROUP BY c.id, u.first_name, u.last_name, u.username, u.avatar_url, t.title, t.id
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const commentsResult = await pool.query(commentsQuery, [projectId, limit, offset]);
    const comments = commentsResult.rows;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      comments,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext,
      hasPrev
    };
  }

  // Create comment
  async createComment(commentData, userId) {
    const { content, task_id, project_id, milestone_id, parent_comment_id } = commentData;

    // Validate that at least one entity is specified
    if (!task_id && !project_id && !milestone_id) {
      throw new Error('Comment must be associated with a task, project, or milestone');
    }

    // Check access based on the entity type
    if (task_id) {
      const taskQuery = await pool.query(
        'SELECT project_id FROM tasks WHERE id = $1',
        [task_id]
      );
      if (taskQuery.rows.length === 0) {
        throw new Error('Task not found');
      }

      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [taskQuery.rows[0].project_id, userId]
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
    } else if (milestone_id) {
      const milestoneQuery = await pool.query(
        'SELECT project_id FROM milestones WHERE id = $1',
        [milestone_id]
      );
      if (milestoneQuery.rows.length === 0) {
        throw new Error('Milestone not found');
      }

      const accessCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [milestoneQuery.rows[0].project_id, userId]
      );
      if (accessCheck.rows.length === 0) {
        throw new Error('Access denied to this milestone');
      }
    }

    // Check if parent comment exists (if provided)
    if (parent_comment_id) {
      const parentCheck = await pool.query(
        'SELECT id FROM comments WHERE id = $1',
        [parent_comment_id]
      );
      if (parentCheck.rows.length === 0) {
        throw new Error('Parent comment not found');
      }
    }

    const result = await pool.query(
      `INSERT INTO comments (content, user_id, task_id, project_id, milestone_id, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [content, userId, task_id, project_id, milestone_id, parent_comment_id]
    );

    return result.rows[0];
  }

  // Update comment
  async updateComment(commentId, content, userId) {
    // Get comment and check ownership
    const commentQuery = await pool.query(
      'SELECT user_id, task_id, project_id, milestone_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentQuery.rows.length === 0) {
      throw new Error('Comment not found');
    }

    const comment = commentQuery.rows[0];

    // Check if user owns the comment or has admin privileges
    if (comment.user_id !== userId) {
      // Check if user is project manager or admin
      let projectId = comment.project_id;
      if (comment.task_id) {
        const taskQuery = await pool.query(
          'SELECT project_id FROM tasks WHERE id = $1',
          [comment.task_id]
        );
        projectId = taskQuery.rows[0].project_id;
      } else if (comment.milestone_id) {
        const milestoneQuery = await pool.query(
          'SELECT project_id FROM milestones WHERE id = $1',
          [comment.milestone_id]
        );
        projectId = milestoneQuery.rows[0].project_id;
      }

      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
        throw new Error('Insufficient permissions to edit this comment');
      }
    }

    const result = await pool.query(
      `UPDATE comments 
       SET content = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content, commentId]
    );

    return result.rows[0];
  }

  // Delete comment
  async deleteComment(commentId, userId) {
    // Get comment and check ownership
    const commentQuery = await pool.query(
      'SELECT user_id, task_id, project_id, milestone_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentQuery.rows.length === 0) {
      throw new Error('Comment not found');
    }

    const comment = commentQuery.rows[0];

    // Check if user owns the comment or has admin privileges
    if (comment.user_id !== userId) {
      // Check if user is project manager or admin
      let projectId = comment.project_id;
      if (comment.task_id) {
        const taskQuery = await pool.query(
          'SELECT project_id FROM tasks WHERE id = $1',
          [comment.task_id]
        );
        projectId = taskQuery.rows[0].project_id;
      } else if (comment.milestone_id) {
        const milestoneQuery = await pool.query(
          'SELECT project_id FROM milestones WHERE id = $1',
          [comment.milestone_id]
        );
        projectId = milestoneQuery.rows[0].project_id;
      }

      const accessCheck = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (accessCheck.rows.length === 0 || !['project_manager', 'admin'].includes(accessCheck.rows[0].role)) {
        throw new Error('Insufficient permissions to delete this comment');
      }
    }

    // Check if comment has replies
    const repliesCheck = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = $1',
      [commentId]
    );
    if (parseInt(repliesCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete comment with replies. Please delete replies first.');
    }

    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [commentId]
    );

    return { id: commentId };
  }

  // Get comment by ID
  async getCommentById(commentId, userId) {
    const query = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        t.title as task_title,
        t.id as task_id,
        p.name as project_name,
        p.id as project_id,
        m.name as milestone_name,
        m.id as milestone_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN milestones m ON c.milestone_id = m.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [commentId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const comment = result.rows[0];

    // Check access based on the entity type
    let projectId = comment.project_id;
    if (comment.task_id) {
      projectId = comment.task_id;
    } else if (comment.milestone_id) {
      projectId = comment.milestone_id;
    }

    const accessCheck = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this comment');
    }

    // Get attachments
    const attachmentsQuery = `
      SELECT id, filename, original_filename, file_size, mime_type, created_at
      FROM attachments
      WHERE comment_id = $1
      ORDER BY created_at ASC
    `;
    const attachmentsResult = await pool.query(attachmentsQuery, [commentId]);
    comment.attachments = attachmentsResult.rows;

    // Get replies
    const repliesQuery = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_comment_id = $1
      ORDER BY c.created_at ASC
    `;
    const repliesResult = await pool.query(repliesQuery, [commentId]);
    comment.replies = repliesResult.rows;

    return comment;
  }
}

module.exports = new CommentController(); 