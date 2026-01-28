'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('job_applications')) {
      console.log('ℹ️  Skipping migration (job_applications not created yet)');
      return;
    }

		// Ensure job_applications has snake_case column cover_letter_id (FK to cover_letters.id)
		const table = await queryInterface.describeTable('job_applications');
		const hasCamel = Object.prototype.hasOwnProperty.call(table, 'coverLetterId');
		const hasSnake = Object.prototype.hasOwnProperty.call(table, 'cover_letter_id');

		if (hasCamel && !hasSnake) {
			// Rename camelCase column to snake_case to match underscored model mapping
			await queryInterface.renameColumn('job_applications', 'coverLetterId', 'cover_letter_id');
		}

		// If neither exists, add the correct snake_case column (without FK constraint for now)
		const tableAfter = await queryInterface.describeTable('job_applications');
		const hasSnakeAfter = Object.prototype.hasOwnProperty.call(tableAfter, 'cover_letter_id');
		if (!hasSnakeAfter) {
			await queryInterface.addColumn('job_applications', 'cover_letter_id', {
				type: Sequelize.UUID,
				allowNull: true
				// Note: Foreign key constraint will be added later when cover_letters table exists
			});
		}

		// Ensure index exists on snake_case column
		try {
			await queryInterface.addIndex('job_applications', ['cover_letter_id']);
		} catch (e) {
			// Ignore if index already exists
		}
	},

	async down(queryInterface, Sequelize) {
		// Best-effort rollback: rename back if camelCase used originally
		const table = await queryInterface.describeTable('job_applications');
		const hasSnake = Object.prototype.hasOwnProperty.call(table, 'cover_letter_id');
		const hasCamel = Object.prototype.hasOwnProperty.call(table, 'coverLetterId');
		if (hasSnake && !hasCamel) {
			try {
				await queryInterface.renameColumn('job_applications', 'cover_letter_id', 'coverLetterId');
			} catch (e) {
				// If rename fails (e.g., FK/index constraints), attempt to remove the index then rename
				try { await queryInterface.removeIndex('job_applications', ['cover_letter_id']); } catch (_) {}
				await queryInterface.renameColumn('job_applications', 'cover_letter_id', 'coverLetterId');
			}
		}
	}
};


