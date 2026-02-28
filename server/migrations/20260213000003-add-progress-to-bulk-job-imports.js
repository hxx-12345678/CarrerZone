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
        await queryInterface.addColumn(table, 'progress', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0
        });
        console.log(`✅ Added progress to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add progress to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.started_at) {
      try {
        await queryInterface.addColumn(table, 'started_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log(`✅ Added started_at to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add started_at to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.completed_at) {
      try {
        await queryInterface.addColumn(table, 'completed_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log(`✅ Added completed_at to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add completed_at to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.cancelled_at) {
      try {
        await queryInterface.addColumn(table, 'cancelled_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log(`✅ Added cancelled_at to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add cancelled_at to ${table}:`, err?.message || err);
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
