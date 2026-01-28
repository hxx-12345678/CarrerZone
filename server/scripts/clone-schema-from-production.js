'use strict';

// Clone schema from a remote Postgres (Render) to local Postgres using pg_dump | psql
// Usage:
//   node scripts/clone-schema-from-production.js
// Env vars required:
//   PROD_DB_URL: remote (Render) connection string
//   LOCAL_DB_URL: local connection string (database must exist)

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

try { require('dotenv').config(); } catch (_) {}

async function run() {
  const prod = process.env.PROD_DB_URL;
  const local = process.env.LOCAL_DB_URL;

  if (!prod || !local) {
    console.error('❌ Missing env: set PROD_DB_URL and LOCAL_DB_URL');
    process.exit(1);
  }

  // Ensure SSL param for Render if not present
  const prodUrl = /[?&]ssl(=|$)/i.test(prod) ? prod : (prod.includes('?') ? `${prod}&ssl=true` : `${prod}?ssl=true`);

  console.log('🔄 Dumping schema from production (schema-only, no data)...');
  const dumpCmd = `pg_dump --schema-only --no-owner --no-privileges --quote-all-identifiers --if-exists --format=plain "${prodUrl}"`;

  console.log('🧪 Applying schema to local database...');
  const applyCmd = `psql "${local}"`;

  // Pipe dump → psql
  const fullCmd = `${dumpCmd} | ${applyCmd}`;
  try {
    const { stdout, stderr } = await execAsync(fullCmd, { maxBuffer: 1024 * 1024 * 64 });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    console.log('✅ Schema clone completed');
  } catch (err) {
    console.error('❌ Schema clone failed:', err?.message || err);
    process.exit(1);
  }
}

run();


