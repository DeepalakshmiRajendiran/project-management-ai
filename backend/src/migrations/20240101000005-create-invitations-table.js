'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invitations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      role: {
        type: Sequelize.ENUM('member', 'developer', 'project_manager', 'viewer'),
        defaultValue: 'member',
        allowNull: false
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
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined', 'cancelled', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      declined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('invitations', ['email']);
    await queryInterface.addIndex('invitations', ['token']);
    await queryInterface.addIndex('invitations', ['status']);
    await queryInterface.addIndex('invitations', ['invited_by']);
    await queryInterface.addIndex('invitations', ['project_id']);
    await queryInterface.addIndex('invitations', ['expires_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invitations');
  }
}; 