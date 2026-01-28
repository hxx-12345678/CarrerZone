'use strict';

// Dump DB schema to a JSON file: tables, columns, data types, nullability, defaults, PKs, FKs, indexes
// Usage: node scripts/dump-schema.js <DB_URL> <OUTPUT_JSON_PATH>

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

async function dump(dbUrl, outPath) {
  // Determine SSL only for known remote hosts (Render), not for localhost or plain IPs
  let finalUrl = dbUrl;
  let dialectOptions = undefined;
  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname || '';
    const isRender = host.includes('render.com');
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isRender) {
      if (!/[?&]ssl(=|$)/i.test(dbUrl)) {
        finalUrl = dbUrl + (dbUrl.includes('?') ? '&ssl=true' : '?ssl=true');
      }
      dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
    }
    if (!isRender && !isLocal) {
      // Leave as-is for other hosts; many managed providers require SSL but not all
      // Do not force SSL to avoid failures
    }
  } catch (_) {
    // Fallback: leave URL as-is
  }

  const sequelize = new Sequelize(finalUrl, {
    dialect: 'postgres',
    dialectOptions,
    logging: false
  });

  try {
    await sequelize.authenticate();
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const schema = {
      databaseUrl: dbUrl,
      generatedAt: new Date().toISOString(),
      tables: {}
    };

    for (const t of tables) {
      const name = t.table_name;
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, udt_name, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${name}'
        ORDER BY ordinal_position;
      `);

      const [pks] = await sequelize.query(`
        SELECT a.attname AS column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = '"${name}"'::regclass AND i.indisprimary;
      `);

      const [fks] = await sequelize.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${name}';
      `);

      const [indexes] = await sequelize.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = '${name}';
      `);

      schema.tables[name] = {
        columns: columns.map(c => ({
          name: c.column_name,
          dataType: (c.udt_name || c.data_type),
          length: c.character_maximum_length,
          nullable: c.is_nullable === 'YES',
          default: c.column_default || null
        })),
        primaryKeys: pks.map(p => p.column_name),
        foreignKeys: fks.map(f => ({ column: f.column_name, refTable: f.foreign_table_name, refColumn: f.foreign_column_name })),
        indexes: indexes.map(i => ({ name: i.indexname, def: i.indexdef }))
      };
    }

    fs.writeFileSync(outPath, JSON.stringify(schema, null, 2), 'utf-8');
    console.log(`✅ Wrote schema dump to ${outPath}`);
  } finally {
    await sequelize.close();
  }
}

async function main() {
  const dbUrl = process.argv[2] || process.env.DB_URL;
  const out = process.argv[3] || path.join(__dirname, '..', 'schema-dump.json');
  if (!dbUrl) {
    console.error('Usage: node scripts/dump-schema.js <DB_URL> <OUTPUT_JSON_PATH>');
    process.exit(1);
  }
  await dump(dbUrl, out);
}

main().catch(err => { console.error(err); process.exit(1); });


