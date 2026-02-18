'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'bulk_job_imports';
    let desc;

    try {
      desc = await queryInterface.describeTable(table);
    } catch (e) {
      console.warn(`⚠️ Could not describe table ${table}:`, e?.message || e);
      return;
    }

    if (!desc.progress) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['progress']) {
          await queryInterface.addColumn('table', 'progress', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
          console.log('✅ Added progress to table');
        } else {
          console.log('ℹ️ Column progress already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column progress already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add progress to table:', err.message);
        }
      }

    }

    if (!desc.started_at) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['started_at']) {
          await queryInterface.addColumn('table', 'started_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
          console.log('✅ Added started_at to table');
        } else {
          console.log('ℹ️ Column started_at already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column started_at already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add started_at to table:', err.message);
        }
      }

    }

    if (!desc.completed_at) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['completed_at']) {
          await queryInterface.addColumn('table', 'completed_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
          console.log('✅ Added completed_at to table');
        } else {
          console.log('ℹ️ Column completed_at already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column completed_at already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add completed_at to table:', err.message);
        }
      }

    }

    if (!desc.cancelled_at) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['cancelled_at']) {
          await queryInterface.addColumn('table', 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
          console.log('✅ Added cancelled_at to table');
        } else {
          console.log('ℹ️ Column cancelled_at already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column cancelled_at already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add cancelled_at to table:', err.message);
        }
      }

    }
  },

  async down(queryInterface) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.progress) await queryInterface.removeColumn(table, 'progress');
      if (desc.started_at) await queryInterface.removeColumn(table, 'started_at');
      if (desc.completed_at) await queryInterface.removeColumn(table, 'completed_at');
      if (desc.cancelled_at) await queryInterface.removeColumn(table, 'cancelled_at');
    } catch (e) {
      console.warn(`⚠️ Could not rollback columns on ${table}:`, e?.message || e);
    }
  }
};
