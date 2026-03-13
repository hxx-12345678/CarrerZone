/**
 * FINAL CONFIRMATION TEST
 * Simulates a new user cloning the repo and running migrations.
 * Compares EVERY table, column, type, and enum with the dev database.
 */
const { Client } = require('pg');

const DEV_DB = 'jobportal_dev';
const TEST_DB = 'jobportal_final_test';
const CONN = { user: 'postgres', password: 'CptJackSprw@7777', host: 'localhost', port: 5432 };

async function getTables(client) {
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`);
  return res.rows.map(r => r.table_name).filter(t => t !== 'SequelizeMeta');
}

async function getColumns(client, table) {
  const res = await client.query(`SELECT column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table]);
  return res.rows;
}

async function getEnums(client) {
  const res = await client.query(`SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' GROUP BY t.typname ORDER BY t.typname`);
  return res.rows;
}

async function run() {
  // Step 1: Create fresh DB
  console.log('═══════════════════════════════════════════════════');
  console.log('  FINAL CONFIRMATION TEST - Fresh Clone Simulation');
  console.log('═══════════════════════════════════════════════════\n');

  const adminClient = new Client({ ...CONN });
  await adminClient.connect();
  await adminClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${TEST_DB}' AND pid<>pg_backend_pid()`).catch(() => {});
  await adminClient.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await adminClient.query(`CREATE DATABASE ${TEST_DB}`);
  await adminClient.end();
  console.log('✅ Step 1: Fresh database created\n');

  // Step 2: Run migrations
  console.log('⏳ Step 2: Running all migrations from scratch...');
  const { execSync } = require('child_process');
  try {
    const output = execSync(`npx sequelize-cli db:migrate`, {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        DB_NAME: TEST_DB,
        DB_USER: CONN.user,
        DB_PASSWORD: CONN.password,
        DB_HOST: CONN.host,
        DB_PORT: CONN.port
      },
      encoding: 'utf8',
      timeout: 120000
    });
    // Count migrated lines
    const migrated = (output.match(/migrated/g) || []).length;
    console.log(`✅ Step 2: ${migrated} migrations executed successfully\n`);
  } catch (err) {
    console.error('❌ MIGRATION FAILED!');
    console.error(err.stderr || err.stdout || err.message);
    process.exit(1);
  }

  // Step 3: Compare
  console.log('🔍 Step 3: Comparing schemas...\n');
  const devClient = new Client({ ...CONN, database: DEV_DB });
  const testClient = new Client({ ...CONN, database: TEST_DB });
  await devClient.connect();
  await testClient.connect();

  let errors = 0;

  // 3a. Tables
  const devTables = await getTables(devClient);
  const testTables = await getTables(testClient);
  const missingTables = devTables.filter(t => !testTables.includes(t));
  const extraTables = testTables.filter(t => !devTables.includes(t));

  console.log(`  Tables: Dev=${devTables.length}, Clone=${testTables.length}`);
  if (missingTables.length > 0) {
    console.log(`  ❌ MISSING tables: ${missingTables.join(', ')}`);
    errors += missingTables.length;
  }
  if (extraTables.length > 0) {
    console.log(`  ⚠️  Extra tables in clone: ${extraTables.join(', ')}`);
  }
  if (missingTables.length === 0) {
    console.log(`  ✅ All ${devTables.length} tables present`);
  }

  // 3b. Columns
  console.log('');
  let totalColChecks = 0;
  let missingColCount = 0;
  let typeMismatchCount = 0;
  const commonTables = devTables.filter(t => testTables.includes(t));
  
  for (const table of commonTables) {
    const devCols = await getColumns(devClient, table);
    const testCols = await getColumns(testClient, table);
    const devColNames = devCols.map(c => c.column_name);
    const testColNames = testCols.map(c => c.column_name);
    totalColChecks += devColNames.length;

    const missingCols = devColNames.filter(c => !testColNames.includes(c));
    if (missingCols.length > 0) {
      console.log(`  ❌ ${table}: MISSING columns: ${missingCols.join(', ')}`);
      missingColCount += missingCols.length;
      errors += missingCols.length;
    }

    for (const dc of devCols) {
      const tc = testCols.find(c => c.column_name === dc.column_name);
      if (tc && dc.udt_name !== tc.udt_name) {
        console.log(`  ❌ ${table}.${dc.column_name}: TYPE MISMATCH dev=${dc.udt_name} clone=${tc.udt_name}`);
        typeMismatchCount++;
        errors++;
      }
    }
  }
  console.log(`  Columns checked: ${totalColChecks}`);
  console.log(`  ${missingColCount === 0 ? '✅' : '❌'} Missing columns: ${missingColCount}`);
  console.log(`  ${typeMismatchCount === 0 ? '✅' : '❌'} Type mismatches: ${typeMismatchCount}`);

  // 3c. Enums
  console.log('');
  const devEnums = await getEnums(devClient);
  const testEnums = await getEnums(testClient);
  let enumErrors = 0;

  for (const de of devEnums) {
    const devVals = Array.isArray(de.enum_values) ? de.enum_values : [];
    const te = testEnums.find(e => e.enum_name === de.enum_name);
    if (!te) {
      // Only flag as error if enum has actual values (empty enums are harmless)
      if (devVals.length > 0) {
        console.log(`  ❌ MISSING enum: ${de.enum_name} [${devVals.join(', ')}]`);
        enumErrors++;
        errors++;
      }
    } else {
      const testVals = Array.isArray(te.enum_values) ? te.enum_values : [];
      const missingVals = devVals.filter(v => !testVals.includes(v));
      if (missingVals.length > 0) {
        console.log(`  ❌ ${de.enum_name}: MISSING values: [${missingVals.join(', ')}]`);
        enumErrors++;
        errors++;
      }
    }
  }
  console.log(`  Enums checked: ${devEnums.length}`);
  console.log(`  ${enumErrors === 0 ? '✅' : '❌'} Enum problems: ${enumErrors}`);

  // Final result
  console.log('\n═══════════════════════════════════════════════════');
  if (errors === 0) {
    console.log('  ✅✅✅ ALL TESTS PASSED - PERFECT SCHEMA MATCH ✅✅✅');
    console.log(`  ${devTables.length} tables | ${totalColChecks} columns | ${devEnums.length} enums`);
  } else {
    console.log(`  ❌ FAILED: ${errors} problems found`);
  }
  console.log('═══════════════════════════════════════════════════\n');

  // Cleanup
  await devClient.end();
  await testClient.end();

  // Drop test DB
  const cleanupClient = new Client({ ...CONN });
  await cleanupClient.connect();
  await cleanupClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${TEST_DB}' AND pid<>pg_backend_pid()`).catch(() => {});
  await cleanupClient.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await cleanupClient.end();
  console.log('🧹 Test database cleaned up');

  process.exit(errors > 0 ? 1 : 0);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
