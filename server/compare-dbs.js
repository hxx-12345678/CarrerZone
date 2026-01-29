const { Sequelize } = require('sequelize');

// Connection Strings
const renderDbUrl = 'postgresql://carrerzone_user:WjhkOSs3qwIfxntDun5bFZaXsdcyBoPN@dpg-d5ted0lactks73a5tcb0-a.virginia-postgres.render.com/carrerzone';
const localDbUrl = 'postgresql://postgres:CptJackSprw%407777@localhost:5432/jobportal_dev?schema=public';

// Initialize Sequelize instances
const renderSequelize = new Sequelize(renderDbUrl, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, // Render requires SSL
    logging: false
});

const localSequelize = new Sequelize(localDbUrl, {
    dialect: 'postgres',
    logging: false // No SSL for local usually
});

async function compareSchemas() {
    console.log('🔄 Starting Database Comparison...');
    console.log(`📡 Render URL: ${renderDbUrl.split('@')[1]}`); // Mask credentials
    console.log(`💻 Local URL: ${localDbUrl.split('@')[1]}`);   // Mask credentials

    let renderConnected = false;
    let localConnected = false;

    try {
        // 1. Connect to Render
        try {
            await renderSequelize.authenticate();
            console.log('✅ Connected to RENDER database.');
            renderConnected = true;
        } catch (e) {
            console.error('❌ Failed to connect to RENDER database:', e.message);
        }

        // 2. Connect to Local
        try {
            await localSequelize.authenticate();
            console.log('✅ Connected to LOCAL database.');
            localConnected = true;
        } catch (e) {
            console.error('❌ Failed to connect to LOCAL database:', e.message);
            console.log('   (Please ensure your local PostgreSQL is running and credentials are correct)');
        }

        if (!renderConnected || !localConnected) {
            console.log('⚠️ Stopping comparison because one or both databases could not be reached.');
            return;
        }

        console.log('\n📊 Fetching schemas...');
        const renderTables = await renderSequelize.getQueryInterface().showAllTables();
        const localTables = await localSequelize.getQueryInterface().showAllTables();

        // Normalize
        const rTables = renderTables.sort();
        const lTables = localTables.sort();

        console.log(`   Render Tables: ${rTables.length}`);
        console.log(`   Local Tables:  ${lTables.length}`);

        // Missing Tables
        const missingInRender = lTables.filter(t => !rTables.includes(t));
        const missingInLocal = rTables.filter(t => !lTables.includes(t));

        if (missingInRender.length > 0) {
            console.error('❌ MISSING TABLES IN RENDER:', missingInRender);
        } else {
            console.log('✅ All local tables exist in Render.');
        }

        if (missingInLocal.length > 0) {
            console.warn('⚠️ Extra tables in Render (likely from old migrations):', missingInLocal);
        }

        // Deep Compare Columns
        console.log('\n🔍 comparing columns...');
        let issuesFound = 0;

        for (const table of lTables) {
            if (!rTables.includes(table)) continue; // Skip if table doesn't exist

            const rCols = await renderSequelize.getQueryInterface().describeTable(table);
            const lCols = await localSequelize.getQueryInterface().describeTable(table);

            const rKeys = Object.keys(rCols).sort();
            const lKeys = Object.keys(lCols).sort();

            const missingCols = lKeys.filter(k => !rKeys.includes(k));
            if (missingCols.length > 0) {
                console.error(`❌ Table [${table}] is missing columns in Render: ${missingCols.join(', ')}`);
                issuesFound++;
            }
        }

        if (issuesFound === 0 && missingInRender.length === 0) {
            console.log('\n✨ SUCCESS: Render database schema matches Local database schema perfectly!');
        } else {
            console.log(`\n❌ COMPARISON FAILED: Found ${issuesFound} column mismatches and ${missingInRender.length} missing tables.`);
        }

    } catch (error) {
        console.error('❌ Unexpected error during comparison:', error);
    } finally {
        await renderSequelize.close();
        await localSequelize.close();
    }
}

compareSchemas();
