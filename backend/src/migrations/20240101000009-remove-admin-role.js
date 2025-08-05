'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update project_members table constraint to remove 'admin'
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      DROP CONSTRAINT IF EXISTS project_members_role_check
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      ADD CONSTRAINT project_members_role_check 
      CHECK (role IN ('member', 'developer', 'project_manager', 'viewer'))
    `);

    // Update invitations table enum to remove 'admin'
    // First, drop the default constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations ALTER COLUMN role DROP DEFAULT
    `);

    // Drop the new enum type if it exists from previous failed migration
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_invitations_role_new"
    `);

    // Create a new enum type without 'admin'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_invitations_role_new" AS ENUM ('member', 'developer', 'project_manager', 'viewer')
    `);

    // Update the column to use the new enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations 
      ALTER COLUMN role TYPE "enum_invitations_role_new" 
      USING role::text::"enum_invitations_role_new"
    `);

    // Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_invitations_role"
    `);

    // Rename the new enum type to the original name
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_invitations_role_new" RENAME TO "enum_invitations_role"
    `);

    // Add back the default constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations ALTER COLUMN role SET DEFAULT 'member'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Add back 'admin' to project_members constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      DROP CONSTRAINT IF EXISTS project_members_role_check
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE project_members 
      ADD CONSTRAINT project_members_role_check 
      CHECK (role IN ('member', 'developer', 'project_manager', 'viewer', 'admin'))
    `);

    // Add back 'admin' to invitations enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_invitations_role" ADD VALUE 'admin'
    `);
  }
}; 