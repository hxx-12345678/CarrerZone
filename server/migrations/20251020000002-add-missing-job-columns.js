'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Add skills column (JSONB)
    if (!tableDescription.skills) {
      await queryInterface.addColumn('jobs', 'skills', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added skills column');
    }
    
    // Add remoteWork column (ENUM)
    if (!tableDescription.remoteWork) {
      await queryInterface.addColumn('jobs', 'remoteWork', {
        type: Sequelize.ENUM('on-site', 'remote', 'hybrid'),
        allowNull: true,
        defaultValue: 'on-site'
      });
      console.log('✅ Added remoteWork column');
    }
    
    // Add travelRequired column (BOOLEAN)
    if (!tableDescription.travelRequired) {
      await queryInterface.addColumn('jobs', 'travelRequired', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added travelRequired column');
    }
    
    // Add shiftTiming column (ENUM)
    if (!tableDescription.shiftTiming) {
      await queryInterface.addColumn('jobs', 'shiftTiming', {
        type: Sequelize.ENUM('day', 'night', 'rotational', 'flexible'),
        allowNull: true,
        defaultValue: 'day'
      });
      console.log('✅ Added shiftTiming column');
    }
    
    // Add noticePeriod column (INTEGER)
    if (!tableDescription.noticePeriod) {
      await queryInterface.addColumn('jobs', 'noticePeriod', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Added noticePeriod column');
    }
    
    // Add education column (STRING)
    if (!tableDescription.education) {
      await queryInterface.addColumn('jobs', 'education', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added education column');
    }
    
    // Add certifications column (JSONB)
    if (!tableDescription.certifications) {
      await queryInterface.addColumn('jobs', 'certifications', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added certifications column');
    }
    
    // Add languages column (JSONB)
    if (!tableDescription.languages) {
      await queryInterface.addColumn('jobs', 'languages', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added languages column');
    }
    
    console.log('✅ Successfully added all missing job columns');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Remove columns in reverse order
    const columnsToRemove = [
      'languages',
      'certifications', 
      'education',
      'noticePeriod',
      'shiftTiming',
      'travelRequired',
      'remoteWork',
      'skills'
    ];
    
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('jobs', column);
        console.log(`✅ Removed ${column} column`);
      }
    }
    
    console.log('✅ Successfully removed all added job columns');
  }
};

