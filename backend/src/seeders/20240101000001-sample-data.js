'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create sample users
    const users = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'john.doe',
        email: 'john.doe@company.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'jane.smith',
        email: 'jane.smith@company.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Jane',
        last_name: 'Smith',
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'mike.johnson',
        email: 'mike.johnson@company.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Mike',
        last_name: 'Johnson',
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users);

    // Get user IDs for references
    const [userResults] = await queryInterface.sequelize.query(
      "SELECT id, username FROM users WHERE username IN ('john.doe', 'jane.smith', 'mike.johnson')"
    );

    const johnDoe = userResults.find(u => u.username === 'john.doe');
    const janeSmith = userResults.find(u => u.username === 'jane.smith');
    const mikeJohnson = userResults.find(u => u.username === 'mike.johnson');

    // Create sample projects
    const projects = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'E-commerce Platform Development',
        description: 'Build a modern e-commerce platform with React frontend and Node.js backend',
        status: 'active',
        priority: 'high',
        start_date: '2024-01-15',
        end_date: '2024-06-30',
        budget: 50000.00,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Mobile App Redesign',
        description: 'Redesign the company mobile app with improved UX and new features',
        status: 'active',
        priority: 'medium',
        start_date: '2024-02-01',
        end_date: '2024-05-15',
        budget: 25000.00,
        created_by: janeSmith.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Database Migration Project',
        description: 'Migrate legacy database to PostgreSQL with data integrity checks',
        status: 'completed',
        priority: 'urgent',
        start_date: '2023-11-01',
        end_date: '2024-01-31',
        budget: 15000.00,
        created_by: mikeJohnson.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'API Documentation Update',
        description: 'Update API documentation and create interactive Swagger docs',
        status: 'on_hold',
        priority: 'low',
        start_date: '2024-03-01',
        end_date: '2024-04-30',
        budget: 8000.00,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('projects', projects);

    // Get project IDs
    const [projectResults] = await queryInterface.sequelize.query(
      "SELECT id, name FROM projects"
    );

    const ecommerceProject = projectResults.find(p => p.name === 'E-commerce Platform Development');
    const mobileAppProject = projectResults.find(p => p.name === 'Mobile App Redesign');
    const dbMigrationProject = projectResults.find(p => p.name === 'Database Migration Project');

    // Create sample milestones
    const milestones = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        name: 'Frontend Development',
        description: 'Complete React frontend with responsive design',
        status: 'in_progress',
        due_date: '2024-03-31',
        completion_percentage: 65,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        name: 'Backend API Development',
        description: 'Develop RESTful APIs with Node.js and Express',
        status: 'pending',
        due_date: '2024-04-30',
        completion_percentage: 0,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        name: 'UI/UX Design',
        description: 'Create new UI designs and user experience flows',
        status: 'completed',
        due_date: '2024-02-28',
        completion_percentage: 100,
        created_by: janeSmith.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        name: 'Development Phase',
        description: 'Implement the new design in React Native',
        status: 'in_progress',
        due_date: '2024-04-30',
        completion_percentage: 40,
        created_by: janeSmith.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('milestones', milestones);

    // Get milestone IDs
    const [milestoneResults] = await queryInterface.sequelize.query(
      "SELECT id, name FROM milestones"
    );

    const frontendMilestone = milestoneResults.find(m => m.name === 'Frontend Development');
    const uiDesignMilestone = milestoneResults.find(m => m.name === 'UI/UX Design');

    // Create sample tasks
    const tasks = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        milestone_id: frontendMilestone.id,
        title: 'Create Product Listing Component',
        description: 'Build a responsive product listing component with filtering and sorting',
        status: 'completed',
        priority: 'high',
        type: 'feature',
        estimated_hours: 16.0,
        actual_hours: 14.5,
        progress_percentage: 100,
        due_date: '2024-03-15',
        assigned_to: johnDoe.id,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        milestone_id: frontendMilestone.id,
        title: 'Implement Shopping Cart',
        description: 'Create shopping cart functionality with local storage',
        status: 'in_progress',
        priority: 'high',
        type: 'feature',
        estimated_hours: 20.0,
        actual_hours: 12.0,
        progress_percentage: 60,
        due_date: '2024-03-25',
        assigned_to: janeSmith.id,
        created_by: johnDoe.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        milestone_id: uiDesignMilestone.id,
        title: 'Design Home Screen',
        description: 'Create modern home screen design with navigation',
        status: 'completed',
        priority: 'medium',
        type: 'task',
        estimated_hours: 8.0,
        actual_hours: 7.5,
        progress_percentage: 100,
        due_date: '2024-02-15',
        assigned_to: mikeJohnson.id,
        created_by: janeSmith.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        milestone_id: uiDesignMilestone.id,
        title: 'Fix Navigation Bug',
        description: 'Fix navigation issue in bottom tab bar',
        status: 'todo',
        priority: 'urgent',
        type: 'bug',
        estimated_hours: 4.0,
        actual_hours: null,
        progress_percentage: 0,
        due_date: '2024-03-10',
        assigned_to: johnDoe.id,
        created_by: janeSmith.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('tasks', tasks);

    // Create project members
    const projectMembers = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        user_id: johnDoe.id,
        joined_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: ecommerceProject.id,
        user_id: janeSmith.id,
        joined_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        user_id: janeSmith.id,
        joined_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        project_id: mobileAppProject.id,
        user_id: mikeJohnson.id,
        joined_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('project_members', projectMembers);

    // Get task IDs for comments
    const [taskResults] = await queryInterface.sequelize.query(
      "SELECT id, title FROM tasks"
    );

    const productListingTask = taskResults.find(t => t.title === 'Create Product Listing Component');
    const shoppingCartTask = taskResults.find(t => t.title === 'Implement Shopping Cart');
    const homeScreenTask = taskResults.find(t => t.title === 'Design Home Screen');

    // Verify tasks exist before creating related data
    if (!productListingTask || !shoppingCartTask || !homeScreenTask) {
      throw new Error('Required tasks not found in database');
    }

    // Create sample comments
    const comments = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        content: 'Great work on the product listing! The filtering works perfectly.',
        user_id: janeSmith.id,
        task_id: productListingTask.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        content: 'I\'ve started working on the shopping cart. Will update progress soon.',
        user_id: janeSmith.id,
        task_id: shoppingCartTask.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        content: 'The home screen design looks amazing! Ready for development.',
        user_id: johnDoe.id,
        task_id: homeScreenTask.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('comments', comments);

    // Create sample time logs
    const timeLogs = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: johnDoe.id,
        task_id: productListingTask.id,
        project_id: ecommerceProject.id,
        description: 'Product listing component development',
        hours_spent: 8.5,
        date: '2024-03-10',
        start_time: '09:00:00',
        end_time: '17:30:00',
        is_billable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: johnDoe.id,
        task_id: productListingTask.id,
        project_id: ecommerceProject.id,
        description: 'Product listing component testing and bug fixes',
        hours_spent: 6.0,
        date: '2024-03-11',
        start_time: '10:00:00',
        end_time: '16:00:00',
        is_billable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: janeSmith.id,
        task_id: shoppingCartTask.id,
        project_id: ecommerceProject.id,
        description: 'Shopping cart initial setup',
        hours_spent: 6.0,
        date: '2024-03-12',
        start_time: '09:00:00',
        end_time: '15:00:00',
        is_billable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: janeSmith.id,
        task_id: shoppingCartTask.id,
        project_id: ecommerceProject.id,
        description: 'Shopping cart functionality implementation',
        hours_spent: 6.0,
        date: '2024-03-13',
        start_time: '09:00:00',
        end_time: '15:00:00',
        is_billable: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('time_logs', timeLogs);
  },

  async down(queryInterface, Sequelize) {
    // Remove sample data in reverse order
    await queryInterface.bulkDelete('time_logs', null, {});
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('project_members', null, {});
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('milestones', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', { username: { [Sequelize.Op.in]: ['john.doe', 'jane.smith', 'mike.johnson'] } });
  }
}; 