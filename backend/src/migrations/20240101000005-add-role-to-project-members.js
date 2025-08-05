'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      ADD COLUMN role VARCHAR(50) DEFAULT 'member' 
      CHECK (role IN ('member', 'developer', 'project_manager', 'viewer', 'admin'))
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      DROP COLUMN role
    `);
  }
}; 