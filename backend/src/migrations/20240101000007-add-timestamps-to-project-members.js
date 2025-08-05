'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add created_at and updated_at columns to project_members table
    await queryInterface.addColumn('project_members', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.addColumn('project_members', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Add trigger to automatically update updated_at column
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_project_members_updated_at 
      BEFORE UPDATE ON project_members 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove trigger first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members
    `);

    // Remove columns
    await queryInterface.removeColumn('project_members', 'updated_at');
    await queryInterface.removeColumn('project_members', 'created_at');
  }
}; 