
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { Requirement, User, JobApplication, Resume, WorkExperience, Education } = require('./server/models/index');
const { Op } = require('sequelize');

async function checkProductionUser() {
    console.log('🔗 Connecting to Production Database...');
    const userEmail = 'aaditya.mahil@hyrebridge.com';

    try {
        const user = await User.findOne({ where: { email: userEmail } });
        if (!user) {
            console.error(`❌ User ${userEmail} not found`);
            return;
        }
        console.log(`✅ Found User: ${user.first_name} ${user.last_name} (${user.id}) [Type: ${user.user_type}]`);

        const requirements = await Requirement.findAll({
            where: { posted_by: user.id },
            order: [['created_at', 'DESC']]
        });

        console.log(`\nRequirements posted by ${userEmail}: ${requirements.length}`);
        for (const req of requirements) {
            const applications = await JobApplication.count({ where: { job_id: req.id } });
            console.log(`- [${req.id}] ${req.title} (${applications} applications)`);

            if (applications > 0) {
                // List some candidates
                const apps = await JobApplication.findAll({
                    where: { job_id: req.id },
                    include: [{ model: User, as: 'applicant' }],
                    limit: 5
                });

                for (const app of apps) {
                    const resume = await Resume.findOne({ where: { userId: app.applicant_id } });
                    const fileType = resume?.metadata?.mimeType || 'unknown';
                    const fileName = resume?.metadata?.originalName || 'no name';
                    console.log(`  - Candidate: ${app.applicant?.first_name} ${app.applicant?.last_name} (${app.applicant_id})`);
                    console.log(`    - Resume: ${fileName} (${fileType})`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        process.exit(0);
    }
}

checkProductionUser();
