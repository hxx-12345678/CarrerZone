'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = 'company_photos';

    // Create table only if it doesn't exist
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS ( SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}' );`
    );
    const exists = tableExists?.[0]?.[0]?.exists === true || tableExists?.[0]?.[0]?.exists === 't';
    if (exists) return;

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE'
      },
      filename: { type: Sequelize.STRING, allowNull: false },
      file_path: { type: Sequelize.STRING, allowNull: false },
      file_url: { type: Sequelize.STRING, allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: false },
      mime_type: { type: Sequelize.STRING, allowNull: false },
      alt_text: { type: Sequelize.STRING },
      caption: { type: Sequelize.TEXT },
      display_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      uploaded_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      metadata: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    // Helpful indexes (ignore if duplicates)
    const idx = async (name, sql) => {
      try { await queryInterface.sequelize.query(sql); } catch (_) {}
    };
    await idx('company_photos_company_id', `CREATE INDEX IF NOT EXISTS company_photos_company_id ON ${tableName}(company_id)`);
    await idx('company_photos_company_id_display_order', `CREATE INDEX IF NOT EXISTS company_photos_company_id_display_order ON ${tableName}(company_id, display_order)`);
    await idx('company_photos_company_id_is_primary', `CREATE INDEX IF NOT EXISTS company_photos_company_id_is_primary ON ${tableName}(company_id, is_primary)`);
    await idx('company_photos_is_active', `CREATE INDEX IF NOT EXISTS company_photos_is_active ON ${tableName}(is_active)`);
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.dropTable('company_photos');
    } catch (_) {}
  }
};


