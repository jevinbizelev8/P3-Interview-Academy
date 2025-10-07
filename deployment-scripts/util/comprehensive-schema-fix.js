// Comprehensive schema fix to align all columns with Drizzle definitions
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixAllSchemaIssues() {
  const client = await pool.connect();

  try {
    console.log('🔧 Starting comprehensive schema alignment...');

    // 1. First, check what columns exist
    console.log('📋 Checking existing columns...');

    const messageColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_messages'
      ORDER BY ordinal_position;
    `);

    console.log('🔍 practice_messages current columns:');
    messageColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const sessionColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_sessions'
      ORDER BY ordinal_position;
    `);

    console.log('🔍 practice_sessions current columns:');
    sessionColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 2. Add missing columns step by step
    console.log('🛠️ Adding any missing columns...');

    // Ensure all required columns exist in practice_messages
    const messageColumnNames = messageColumns.rows.map(r => r.column_name);

    if (!messageColumnNames.includes('timestamp')) {
      await client.query('ALTER TABLE practice_messages ADD COLUMN timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added timestamp to practice_messages');
    }

    if (!messageColumnNames.includes('created_at')) {
      await client.query('ALTER TABLE practice_messages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added created_at to practice_messages');
    }

    // Ensure all required columns exist in practice_sessions
    const sessionColumnNames = sessionColumns.rows.map(r => r.column_name);

    if (!sessionColumnNames.includes('created_at')) {
      await client.query('ALTER TABLE practice_sessions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added created_at to practice_sessions');
    }

    if (!sessionColumnNames.includes('updated_at')) {
      await client.query('ALTER TABLE practice_sessions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added updated_at to practice_sessions');
    }

    // 3. Ensure practice_reports has all needed columns
    const reportColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_reports'
      ORDER BY ordinal_position;
    `);

    const reportColumnNames = reportColumns.rows.map(r => r.column_name);

    if (!reportColumnNames.includes('created_at')) {
      await client.query('ALTER TABLE practice_reports ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added created_at to practice_reports');
    }

    if (!reportColumnNames.includes('updated_at')) {
      await client.query('ALTER TABLE practice_reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      console.log('✅ Added updated_at to practice_reports');
    }

    // 4. Update any NULL timestamps to current timestamp
    console.log('🔄 Updating NULL timestamps...');

    await client.query(`
      UPDATE practice_messages
      SET
        timestamp = CURRENT_TIMESTAMP
      WHERE timestamp IS NULL;
    `);

    await client.query(`
      UPDATE practice_messages
      SET
        created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL;
    `);

    await client.query(`
      UPDATE practice_sessions
      SET
        created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL;
    `);

    await client.query(`
      UPDATE practice_sessions
      SET
        updated_at = CURRENT_TIMESTAMP
      WHERE updated_at IS NULL;
    `);

    console.log('✅ All NULL timestamps updated');

    // 5. Verify the final schema
    console.log('🔍 Verifying final schema...');

    const finalMessageColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_messages'
      AND column_name IN ('timestamp', 'created_at')
      ORDER BY column_name;
    `);

    console.log('📊 practice_messages timestamp columns:');
    finalMessageColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    const finalSessionColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_sessions'
      AND column_name IN ('created_at', 'updated_at')
      ORDER BY column_name;
    `);

    console.log('📊 practice_sessions timestamp columns:');
    finalSessionColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Comprehensive schema alignment completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Schema alignment failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run comprehensive fix
fixAllSchemaIssues()
  .then(() => {
    console.log('✨ Schema alignment successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema alignment failed:', error.message);
    process.exit(1);
  });