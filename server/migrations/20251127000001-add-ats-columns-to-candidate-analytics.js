'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Adding ATS columns to candidate_analytics table...');
    
    try {
      // Add ATS-specific columns to candidate_analytics table
      await queryInterface.addColumn('candidate_analytics', 'user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Candidate user ID for ATS scoring',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      await queryInterface.addColumn('candidate_analytics', 'requirement_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Job requirement ID for ATS scoring',
        references: {
          model: 'requirements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      await queryInterface.addColumn('candidate_analytics', 'ats_score', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ATS score (0-100) for the candidate-requirement match'
      });

      await queryInterface.addColumn('candidate_analytics', 'ats_analysis', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Detailed ATS analysis data'
      });

      await queryInterface.addColumn('candidate_analytics', 'last_calculated', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the ATS score was last calculated'
      });

      // Add indexes for ATS queries
      await queryInterface.addIndex('candidate_analytics', ['user_id'], {
        name: 'candidate_analytics_user_id_idx'
      });

      await queryInterface.addIndex('candidate_analytics', ['requirement_id'], {
        name: 'candidate_analytics_requirement_id_idx'
      });

      await queryInterface.addIndex('candidate_analytics', ['user_id', 'requirement_id'], {
        name: 'candidate_analytics_user_requirement_idx',
        unique: true
      });

      await queryInterface.addIndex('candidate_analytics', ['ats_score'], {
        name: 'candidate_analytics_ats_score_idx'
      });

      console.log('✅ ATS columns added to candidate_analytics table');
    } catch (error) {
      console.error('❌ Error adding ATS columns:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing ATS columns from candidate_analytics table...');
    
    try {
      // Remove indexes first
      await queryInterface.removeIndex('candidate_analytics', 'candidate_analytics_user_id_idx');
      await queryInterface.removeIndex('candidate_analytics', 'candidate_analytics_requirement_id_idx');
      await queryInterface.removeIndex('candidate_analytics', 'candidate_analytics_user_requirement_idx');
      await queryInterface.removeIndex('candidate_analytics', 'candidate_analytics_ats_score_idx');

      // Remove columns
      await queryInterface.removeColumn('candidate_analytics', 'user_id');
      await queryInterface.removeColumn('candidate_analytics', 'requirement_id');
      await queryInterface.removeColumn('candidate_analytics', 'ats_score');
      await queryInterface.removeColumn('candidate_analytics', 'ats_analysis');
      await queryInterface.removeColumn('candidate_analytics', 'last_calculated');

      console.log('✅ ATS columns removed from candidate_analytics table');
    } catch (error) {
      console.error('❌ Error removing ATS columns:', error);
      throw error;
    }
  }
};
