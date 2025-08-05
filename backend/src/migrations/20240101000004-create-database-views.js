'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create project_summary view
    const projectSummaryView = `
      CREATE VIEW project_summary AS
      SELECT 
        p.id,
        p.name,
        p.status,
        p.priority,
        p.start_date,
        p.end_date,
        p.created_by,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_milestones,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours,
        COUNT(DISTINCT pm.user_id) as team_size
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN milestones m ON p.id = m.project_id
      LEFT JOIN time_logs tl ON p.id = tl.project_id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      GROUP BY p.id, p.name, p.status, p.priority, p.start_date, p.end_date, p.created_by, u.first_name, u.last_name;
    `;

    await queryInterface.sequelize.query(projectSummaryView);

    // Create task_summary view
    const taskSummaryView = `
      CREATE VIEW task_summary AS
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date,
        t.project_id,
        p.name as project_name,
        t.milestone_id,
        m.name as milestone_name,
        t.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        t.estimated_hours,
        t.actual_hours,
        t.progress_percentage,
        COALESCE(SUM(tl.hours_spent), 0) as logged_hours,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT a.id) as attachment_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN time_logs tl ON t.id = tl.task_id
      LEFT JOIN comments c ON t.id = c.task_id
      LEFT JOIN attachments a ON t.id = a.task_id
      GROUP BY t.id, t.title, t.status, t.priority, t.due_date, t.project_id, p.name, t.milestone_id, m.name, t.assigned_to, u.first_name, u.last_name, t.estimated_hours, t.actual_hours, t.progress_percentage;
    `;

    await queryInterface.sequelize.query(taskSummaryView);

    // Create user_activity view
    const userActivityView = `
      CREATE VIEW user_activity AS
      SELECT 
        u.id,
        u.username,
        u.first_name || ' ' || u.last_name as full_name,
        COUNT(DISTINCT t.id) as assigned_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COALESCE(SUM(tl.hours_spent), 0) as total_hours_logged,
        COUNT(DISTINCT c.id) as comments_made,
        COUNT(DISTINCT a.id) as attachments_uploaded,
        u.last_login
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      LEFT JOIN time_logs tl ON u.id = tl.user_id
      LEFT JOIN comments c ON u.id = c.user_id
      LEFT JOIN attachments a ON u.id = a.user_id
      GROUP BY u.id, u.username, u.first_name, u.last_name, u.last_login;
    `;

    await queryInterface.sequelize.query(userActivityView);

    // Insert default roles
    const defaultRoles = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'admin',
        description: 'System Administrator',
        permissions: JSON.stringify({ all: true }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'project_manager',
        description: 'Project Manager',
        permissions: JSON.stringify({
          projects: { create: true, read: true, update: true, delete: true },
          tasks: { create: true, read: true, update: true, delete: true },
          milestones: { create: true, read: true, update: true, delete: true }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'developer',
        description: 'Developer',
        permissions: JSON.stringify({
          tasks: { create: true, read: true, update: true },
          milestones: { read: true }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'viewer',
        description: 'Viewer',
        permissions: JSON.stringify({
          projects: { read: true },
          tasks: { read: true },
          milestones: { read: true }
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', defaultRoles);

    // Insert a default admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      id: Sequelize.literal('uuid_generate_v4()'),
      username: 'admin',
      email: 'admin@projectmanagement.com',
      password_hash: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      is_active: true,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await queryInterface.bulkInsert('users', [adminUser]);

    // Get the admin user and admin role IDs to create the relationship
    const [adminUserResult] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    const [adminRoleResult] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'"
    );

    if (adminUserResult.length > 0 && adminRoleResult.length > 0) {
      const adminUserRole = {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: adminUserResult[0].id,
        role_id: adminRoleResult[0].id,
        created_at: new Date()
      };

      await queryInterface.bulkInsert('user_roles', [adminUserRole]);
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop views
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS user_activity;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS task_summary;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS project_summary;');

    // Remove default data
    await queryInterface.sequelize.query("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username = 'admin');");
    await queryInterface.sequelize.query("DELETE FROM users WHERE username = 'admin';");
    await queryInterface.sequelize.query("DELETE FROM roles WHERE name IN ('admin', 'project_manager', 'developer', 'viewer');");
  }
}; 