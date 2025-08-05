'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the index on parent_task_id first
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_tasks_parent
    `);

    // Drop the parent_task_id column from tasks table
    await queryInterface.removeColumn('tasks', 'parent_task_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the parent_task_id column
    await queryInterface.addColumn('tasks', 'parent_task_id', {
      type: Sequelize.UUID,
      references: {
        model: 'tasks',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    // Re-add the index
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_tasks_parent ON tasks(parent_task_id)
    `);
  }
}; 