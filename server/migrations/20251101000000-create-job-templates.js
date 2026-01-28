'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // If table already exists (possibly with snake_case columns), skip creation to avoid column name conflicts
    const [existsRows] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'job_templates'
      ) AS exists;
    `);
    const tableExists = Array.isArray(existsRows) ? existsRows[0]?.exists : existsRows?.exists;
    if (tableExists) {
      console.log('ℹ️ job_templates already exists; skipping table creation and seeding');
      return;
    }
    await queryInterface.createTable('job_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Template name for easy identification'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Template description'
      },
      category: {
        type: Sequelize.ENUM('technical', 'non-technical', 'management', 'entry-level', 'senior', 'custom'),
        allowNull: false,
        defaultValue: 'custom',
        comment: 'Template category for organization'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether template is available to all employers'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a system default template'
      },
      template_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Structured template data including all job fields'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of times this template has been used'
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time this template was used'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether template is active and available'
      },
      tags: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Tags for easy searching and categorization'
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Template version for tracking changes'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who created this template'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance (idempotent and column-name variant aware)
    const indexExists = async (name) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname = :idx`,
        { replacements: { idx: name } }
      );
      return Array.isArray(rows) && rows.length > 0;
    };
    const tryIndex = async (columnsVariants, name) => {
      if (await indexExists(name)) {
        console.log(`ℹ️ Index ${name} already exists, skipping`);
        return;
      }
      for (const cols of columnsVariants) {
        try {
          await queryInterface.addIndex('job_templates', cols, { name });
          console.log(`✅ Created index ${name} on ${cols.join(',')}`);
          return;
        } catch (e) {
          console.log(`ℹ️ Could not create ${name} on ${cols.join(',')}: ${e.message}`);
        }
      }
      console.log(`⚠️ Skipping index ${name} - no matching column variant found`);
    };

    await tryIndex([['created_by']], 'job_templates_created_by');
    await tryIndex([['is_public']], 'job_templates_is_public');
    await tryIndex([['category']], 'job_templates_category');
    await tryIndex([['is_active']], 'job_templates_is_active');
    await tryIndex([['created_at']], 'job_templates_created_at');

    // Insert some default templates only if users exist
    const [users] = await queryInterface.sequelize.query('SELECT id FROM "users" LIMIT 1');
    if (users && users.length > 0) {
      await queryInterface.bulkInsert('job_templates', [
        {
          id: Sequelize.literal('gen_random_uuid()'),
          name: 'Senior Software Engineer',
          description: 'Template for senior software engineering positions with comprehensive requirements',
          category: 'technical',
          isPublic: true,
          isDefault: true,
          templateData: Sequelize.literal(`'{
            "title": "Senior Software Engineer",
            "department": "engineering",
            "location": "Remote / Hybrid",
            "type": "full-time",
            "experience": "senior",
            "salary": "₹15-30 LPA",
            "description": "We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.",
            "requirements": "• 5+ years of experience in software development\\n• Strong knowledge of modern programming languages (Java, Python, or JavaScript)\\n• Experience with cloud platforms (AWS, Azure, or GCP)\\n• Knowledge of microservices architecture\\n• Experience with CI/CD pipelines\\n• Strong problem-solving and communication skills",
            "benefits": "• Competitive salary and equity\\n• Health, dental, and vision insurance\\n• Flexible work arrangements\\n• Professional development opportunities\\n• Modern tech stack and tools",
            "skills": ["Java", "Python", "JavaScript", "AWS", "Microservices", "Docker", "Kubernetes"]
          }'::jsonb`),
          tags: Sequelize.literal(`'["engineering", "senior", "full-stack", "remote"]'::jsonb`),
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: Sequelize.literal('gen_random_uuid()'),
          name: 'Marketing Manager',
          description: 'Template for marketing management roles with strategic focus',
          category: 'non-technical',
          is_public: true,
          is_default: true,
          template_data: Sequelize.literal(`'{
            "title": "Marketing Manager",
            "department": "marketing",
            "location": "Hybrid",
            "type": "full-time",
            "experience": "mid",
            "salary": "₹12-20 LPA",
            "description": "We are seeking a Marketing Manager to develop and execute marketing strategies that drive brand awareness and customer acquisition.",
            "requirements": "• 3+ years of experience in marketing\\n• Experience with digital marketing channels\\n• Knowledge of marketing automation tools\\n• Strong analytical and creative skills\\n• Experience with brand management\\n• Excellent communication and leadership skills",
            "benefits": "• Competitive salary package\\n• Health insurance\\n• Performance bonuses\\n• Professional development\\n• Collaborative work environment",
            "skills": ["Digital Marketing", "Brand Management", "Marketing Automation", "Analytics", "Social Media"]
          }'::jsonb`),
          tags: Sequelize.literal(`'["marketing", "management", "strategy", "digital"]'::jsonb`),
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: Sequelize.literal('gen_random_uuid()'),
          name: 'Frontend Developer',
          description: 'Template for frontend development positions',
          category: 'technical',
          is_public: true,
          is_default: true,
          template_data: Sequelize.literal(`'{
            "title": "Frontend Developer",
            "department": "engineering",
            "location": "On-site / Hybrid",
            "type": "full-time",
            "experience": "junior",
            "salary": "₹8-15 LPA",
            "description": "We are looking for a Frontend Developer to create engaging user experiences and build responsive web applications.",
            "requirements": "• 1+ years of experience in frontend development\\n• Proficiency in HTML, CSS, and JavaScript\\n• Experience with modern frameworks (React, Vue, or Angular)\\n• Knowledge of responsive design principles\\n• Understanding of web performance optimization\\n• Good problem-solving skills",
            "benefits": "• Competitive salary\\n• Health insurance\\n• Learning and development budget\\n• Modern development tools\\n• Collaborative team environment",
            "skills": ["HTML", "CSS", "JavaScript", "React", "Vue.js", "Responsive Design"]
          }'::jsonb`),
          tags: Sequelize.literal(`'["frontend", "react", "javascript", "web-development"]'::jsonb`),
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_templates');
  }
};
