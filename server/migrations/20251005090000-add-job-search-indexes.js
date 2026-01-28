'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: ensure tables and columns exist before creating indexes
    const getColumns = async (table) => {
      const [rows] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}'
      `);
      return new Set(rows.map(r => r.column_name));
    };

    const jobsCols = await getColumns('jobs');
    const companiesCols = await getColumns('companies');

    const addIndexIf = async (table, col, name) => {
      const cols = table === 'jobs' ? jobsCols : companiesCols;
      if (cols.has(col)) {
        try { await queryInterface.addIndex(table, [col], { name }); } catch (e) {}
      }
    };

    // Jobs table indexes (only if columns exist)
    await addIndexIf('jobs', 'experienceMin', 'jobs_experience_min_idx');
    await addIndexIf('jobs', 'experienceMax', 'jobs_experience_max_idx');
    await addIndexIf('jobs', 'salaryMin', 'jobs_salary_min_idx');
    await addIndexIf('jobs', 'remoteWork', 'jobs_remote_work_idx');
    await addIndexIf('jobs', 'education', 'jobs_education_idx');
    await addIndexIf('jobs', 'department', 'jobs_department_idx');
    await addIndexIf('jobs', 'title', 'jobs_title_idx');
    await addIndexIf('jobs', 'location', 'jobs_location_idx');

    // GIN index on JSONB skills for fast contains
    if (jobsCols.has('skills')) {
      await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS jobs_skills_gin_idx ON jobs USING GIN (skills)');
    }

    // Companies table indexes
    await addIndexIf('companies', 'industry', 'companies_industry_idx');
    await addIndexIf('companies', 'companyType', 'companies_company_type_idx');
    await addIndexIf('companies', 'name', 'companies_name_idx');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('jobs', 'jobs_experience_min_idx');
    await queryInterface.removeIndex('jobs', 'jobs_experience_max_idx');
    await queryInterface.removeIndex('jobs', 'jobs_salary_min_idx');
    await queryInterface.removeIndex('jobs', 'jobs_remote_work_idx');
    await queryInterface.removeIndex('jobs', 'jobs_education_idx');
    await queryInterface.removeIndex('jobs', 'jobs_department_idx');
    await queryInterface.removeIndex('jobs', 'jobs_title_idx');
    await queryInterface.removeIndex('jobs', 'jobs_location_idx');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS jobs_skills_gin_idx');

    await queryInterface.removeIndex('companies', 'companies_industry_idx');
    await queryInterface.removeIndex('companies', 'companies_company_type_idx');
    await queryInterface.removeIndex('companies', 'companies_name_idx');
  }
};


