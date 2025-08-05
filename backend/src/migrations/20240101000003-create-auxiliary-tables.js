'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create task_watchers table (Many-to-Many Relationship)
    await queryInterface.createTable('task_watchers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for task_watchers
    await queryInterface.addConstraint('task_watchers', {
      fields: ['task_id', 'user_id'],
      type: 'unique',
      name: 'task_watchers_unique'
    });

    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('task', 'project', 'milestone', 'comment', 'system'),
        defaultValue: 'system'
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      related_entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      related_entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create activity_logs table
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create settings table
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      setting_value: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for settings
    await queryInterface.addConstraint('settings', {
      fields: ['user_id', 'project_id', 'setting_key'],
      type: 'unique',
      name: 'settings_unique'
    });

    // Create indexes for performance
    // Users indexes
    await queryInterface.addIndex('users', ['email'], { name: 'idx_users_email' });
    await queryInterface.addIndex('users', ['username'], { name: 'idx_users_username' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'idx_users_active' });

    // Projects indexes
    await queryInterface.addIndex('projects', ['created_by'], { name: 'idx_projects_created_by' });
    await queryInterface.addIndex('projects', ['status'], { name: 'idx_projects_status' });
    await queryInterface.addIndex('projects', ['start_date', 'end_date'], { name: 'idx_projects_dates' });

    // Milestones indexes
    await queryInterface.addIndex('milestones', ['project_id'], { name: 'idx_milestones_project' });
    await queryInterface.addIndex('milestones', ['status'], { name: 'idx_milestones_status' });
    await queryInterface.addIndex('milestones', ['due_date'], { name: 'idx_milestones_due_date' });
    await queryInterface.addIndex('milestones', ['created_by'], { name: 'idx_milestones_created_by' });

    // Tasks indexes
    await queryInterface.addIndex('tasks', ['project_id'], { name: 'idx_tasks_project' });
    await queryInterface.addIndex('tasks', ['milestone_id'], { name: 'idx_tasks_milestone' });
    await queryInterface.addIndex('tasks', ['assigned_to'], { name: 'idx_tasks_assigned' });
    await queryInterface.addIndex('tasks', ['status'], { name: 'idx_tasks_status' });
    await queryInterface.addIndex('tasks', ['priority'], { name: 'idx_tasks_priority' });
    await queryInterface.addIndex('tasks', ['due_date'], { name: 'idx_tasks_due_date' });
    await queryInterface.addIndex('tasks', ['parent_task_id'], { name: 'idx_tasks_parent' });
    await queryInterface.addIndex('tasks', ['created_by'], { name: 'idx_tasks_created_by' });

    // Comments indexes
    await queryInterface.addIndex('comments', ['user_id'], { name: 'idx_comments_user' });
    await queryInterface.addIndex('comments', ['task_id'], { name: 'idx_comments_task' });
    await queryInterface.addIndex('comments', ['project_id'], { name: 'idx_comments_project' });
    await queryInterface.addIndex('comments', ['milestone_id'], { name: 'idx_comments_milestone' });
    await queryInterface.addIndex('comments', ['created_at'], { name: 'idx_comments_created' });

    // Attachments indexes
    await queryInterface.addIndex('attachments', ['user_id'], { name: 'idx_attachments_user' });
    await queryInterface.addIndex('attachments', ['task_id'], { name: 'idx_attachments_task' });
    await queryInterface.addIndex('attachments', ['project_id'], { name: 'idx_attachments_project' });
    await queryInterface.addIndex('attachments', ['milestone_id'], { name: 'idx_attachments_milestone' });
    await queryInterface.addIndex('attachments', ['comment_id'], { name: 'idx_attachments_comment' });
    await queryInterface.addIndex('attachments', ['mime_type'], { name: 'idx_attachments_mime' });

    // Time logs indexes
    await queryInterface.addIndex('time_logs', ['user_id'], { name: 'idx_time_logs_user' });
    await queryInterface.addIndex('time_logs', ['task_id'], { name: 'idx_time_logs_task' });
    await queryInterface.addIndex('time_logs', ['project_id'], { name: 'idx_time_logs_project' });
    await queryInterface.addIndex('time_logs', ['date'], { name: 'idx_time_logs_date' });

    // User roles indexes
    await queryInterface.addIndex('user_roles', ['user_id'], { name: 'idx_user_roles_user' });
    await queryInterface.addIndex('user_roles', ['role_id'], { name: 'idx_user_roles_role' });
    await queryInterface.addIndex('user_roles', ['project_id'], { name: 'idx_user_roles_project' });

    // Project members indexes
    await queryInterface.addIndex('project_members', ['project_id'], { name: 'idx_project_members_project' });
    await queryInterface.addIndex('project_members', ['user_id'], { name: 'idx_project_members_user' });

    // Task watchers indexes
    await queryInterface.addIndex('task_watchers', ['task_id'], { name: 'idx_task_watchers_task' });
    await queryInterface.addIndex('task_watchers', ['user_id'], { name: 'idx_task_watchers_user' });

    // Notifications indexes
    await queryInterface.addIndex('notifications', ['user_id'], { name: 'idx_notifications_user' });
    await queryInterface.addIndex('notifications', ['is_read'], { name: 'idx_notifications_read' });
    await queryInterface.addIndex('notifications', ['created_at'], { name: 'idx_notifications_created' });

    // Activity logs indexes
    await queryInterface.addIndex('activity_logs', ['user_id'], { name: 'idx_activity_logs_user' });
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id'], { name: 'idx_activity_logs_entity' });
    await queryInterface.addIndex('activity_logs', ['created_at'], { name: 'idx_activity_logs_created' });

    // Create triggers for updated_at timestamps
    const updateTriggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    await queryInterface.sequelize.query(updateTriggerFunction);

    // Create triggers for each table with updated_at
    const tablesWithUpdatedAt = ['users', 'projects', 'milestones', 'tasks', 'comments', 'roles', 'settings', 'time_logs'];
    
    for (const table of tablesWithUpdatedAt) {
      const triggerQuery = `
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table} 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      await queryInterface.sequelize.query(triggerQuery);
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop triggers first
    const tablesWithUpdatedAt = ['users', 'projects', 'milestones', 'tasks', 'comments', 'roles', 'settings', 'time_logs'];
    
    for (const table of tablesWithUpdatedAt) {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};`);
    }

    // Drop the function
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at_column();');

    // Drop indexes
    const indexes = [
      'idx_users_email', 'idx_users_username', 'idx_users_active',
      'idx_projects_created_by', 'idx_projects_status', 'idx_projects_dates',
      'idx_milestones_project', 'idx_milestones_status', 'idx_milestones_due_date', 'idx_milestones_created_by',
      'idx_tasks_project', 'idx_tasks_milestone', 'idx_tasks_assigned', 'idx_tasks_status', 'idx_tasks_priority', 'idx_tasks_due_date', 'idx_tasks_parent', 'idx_tasks_created_by',
      'idx_comments_user', 'idx_comments_task', 'idx_comments_project', 'idx_comments_milestone', 'idx_comments_created',
      'idx_attachments_user', 'idx_attachments_task', 'idx_attachments_project', 'idx_attachments_milestone', 'idx_attachments_comment', 'idx_attachments_mime',
      'idx_time_logs_user', 'idx_time_logs_task', 'idx_time_logs_project', 'idx_time_logs_date',
      'idx_user_roles_user', 'idx_user_roles_role', 'idx_user_roles_project',
      'idx_project_members_project', 'idx_project_members_user',
      'idx_task_watchers_task', 'idx_task_watchers_user',
      'idx_notifications_user', 'idx_notifications_read', 'idx_notifications_created',
      'idx_activity_logs_user', 'idx_activity_logs_entity', 'idx_activity_logs_created'
    ];

    for (const index of indexes) {
      try {
        await queryInterface.removeIndex('users', index);
      } catch (error) {
        // Index might not exist, continue
      }
    }

    // Drop tables in reverse order
    await queryInterface.dropTable('settings');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('task_watchers');
  }
}; 