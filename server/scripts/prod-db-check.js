'use strict';

(async () => {
  const { sequelize } = require('../config/sequelize');

  const must = (name) => {
    if (!process.env[name]) {
      throw new Error(`Missing required env var: ${name}`);
    }
  };

  must('DATABASE_URL');

  try {
    await sequelize.authenticate();
    console.log('DB: connected');

    const emails = [
      'aaditya.mahil@hyrebridge.com',
      'manavparmar0903@gmail.com'
    ];

    const [userRows] = await sequelize.query(
      `
      SELECT
        id,
        email,
        user_type,
        account_status,
        company_id,
        is_email_verified,
        is_active,
        created_at,
        updated_at,
        CASE WHEN password IS NULL THEN NULL ELSE left(password, 4) END AS pw_prefix,
        CASE WHEN password IS NULL THEN 0 ELSE length(password) END AS pw_len
      FROM users
      WHERE lower(email) IN (:emails)
      ORDER BY email;
      `,
      {
        replacements: { emails: emails.map((e) => e.toLowerCase()) }
      }
    );

    console.log('USERS:');
    console.log(JSON.stringify(userRows, null, 2));

    const [invRows] = await sequelize.query(
      `
      SELECT id, email, status, company_id, expires_at, created_at, updated_at
      FROM team_invitations
      WHERE lower(email) = :email
      ORDER BY created_at DESC
      LIMIT 10;
      `,
      {
        replacements: { email: 'manavparmar0903@gmail.com' }
      }
    );

    console.log('INVITES for manavparmar0903@gmail.com:');
    console.log(JSON.stringify(invRows, null, 2));

    const [colRows] = await sequelize.query(
      `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bulk_job_imports'
      ORDER BY ordinal_position;
      `
    );

    const cols = colRows.map((c) => c.column_name);
    console.log('bulk_job_imports columns:', cols.join(', '));
    console.log('has file_url:', cols.includes('file_url'));
    console.log('has file_path:', cols.includes('file_path'));

    process.exitCode = 0;
  } catch (e) {
    console.error('ERR:', e?.message || e);
    if (e?.parent?.message) console.error('PARENT:', e.parent.message);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
})();
