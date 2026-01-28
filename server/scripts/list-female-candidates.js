const { User, sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function listFemaleCandidates() {
  try {
    console.log('🔍 Fetching all female candidates from database...\n');
    
    const femaleCandidates = await User.findAll({
      where: {
        user_type: 'jobseeker',
        gender: 'female',
        account_status: 'active',
        is_active: true
      },
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'headline',
        'designation',
        'current_location',
        'current_company',
        'current_salary',
        'experience_years',
        'notice_period',
        'skills',
        'key_skills',
        'is_phone_verified',
        'is_email_verified',
        'created_at',
        'last_login_at',
        'last_profile_update'
      ],
      order: [['created_at', 'DESC']],
      limit: 1000
    });
    
    console.log(`✅ Found ${femaleCandidates.length} female candidates:\n`);
    console.log('='.repeat(100));
    
    femaleCandidates.forEach((candidate, index) => {
      const candidateData = candidate.toJSON();
      const fullName = `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'N/A';
      console.log(`\n${index + 1}. ${fullName}`);
      console.log(`   ID: ${candidateData.id}`);
      console.log(`   Email: ${candidateData.email || 'N/A'}`);
      console.log(`   Phone: ${candidateData.phone || 'N/A'} (Verified: ${candidateData.is_phone_verified ? 'Yes' : 'No'})`);
      console.log(`   Email Verified: ${candidateData.is_email_verified ? 'Yes' : 'No'}`);
      console.log(`   Gender: ${candidateData.gender || 'N/A'}`);
      console.log(`   Headline: ${candidateData.headline || 'N/A'}`);
      console.log(`   Designation: ${candidateData.designation || 'N/A'}`);
      console.log(`   Current Company: ${candidateData.current_company || 'N/A'}`);
      console.log(`   Location: ${candidateData.current_location || 'N/A'}`);
      console.log(`   Experience: ${candidateData.experience_years || 0} years`);
      console.log(`   Current Salary: ${candidateData.current_salary || 'N/A'}`);
      console.log(`   Notice Period: ${candidateData.notice_period || 'N/A'} days`);
      console.log(`   Skills: ${Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : 'N/A'}`);
      console.log(`   Key Skills: ${Array.isArray(candidateData.key_skills) ? candidateData.key_skills.join(', ') : 'N/A'}`);
      console.log(`   Last Login: ${candidateData.last_login_at ? new Date(candidateData.last_login_at).toLocaleString() : 'Never'}`);
      console.log(`   Last Profile Update: ${candidateData.last_profile_update ? new Date(candidateData.last_profile_update).toLocaleString() : 'Never'}`);
      console.log(`   Created: ${candidateData.created_at ? new Date(candidateData.created_at).toLocaleString() : 'N/A'}`);
      console.log('-'.repeat(100));
    });
    
    console.log(`\n✅ Total female candidates: ${femaleCandidates.length}`);
    
    // Also get count of all candidates by gender
    const genderStats = await User.findAll({
      where: {
        user_type: 'jobseeker',
        account_status: 'active',
        is_active: true
      },
      attributes: [
        'gender',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['gender'],
      raw: true
    });
    
    console.log('\n📊 Gender Statistics:');
    genderStats.forEach(stat => {
      console.log(`   ${stat.gender || 'Not Specified'}: ${stat.count}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error listing female candidates:', error);
    await sequelize.close();
    process.exit(1);
  }
}

listFemaleCandidates();



