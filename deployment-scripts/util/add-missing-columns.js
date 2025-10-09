// Add missing columns to practice_reports table
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const ADD_MISSING_COLUMNS = [
  `ALTER TABLE practice_reports ADD COLUMN IF NOT EXISTS key_insights JSONB DEFAULT '[]';`,
  `ALTER TABLE practice_reports ADD COLUMN IF NOT EXISTS recommended_actions JSONB DEFAULT '[]';`,
  `ALTER TABLE practice_reports ADD COLUMN IF NOT EXISTS evaluation_completed BOOLEAN DEFAULT false;`,
  `ALTER TABLE practice_reports ADD COLUMN IF NOT EXISTS evaluated_by VARCHAR(50) DEFAULT 'ai';`
];

async function addMissingColumns() {
  const client = await pool.connect();

  try {
    console.log('🔧 Adding missing columns to practice_reports...');

    // Add missing columns one by one
    for (const query of ADD_MISSING_COLUMNS) {
      await client.query(query);
    }
    console.log('✅ Missing columns added');

    // Verify the columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_reports'
      AND column_name IN ('key_insights', 'recommended_actions', 'evaluation_completed', 'evaluated_by')
      ORDER BY column_name;
    `);

    console.log('📊 Added columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
    });

    console.log('🎉 Column addition completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run addition
addMissingColumns()
  .then(() => {
    console.log('✨ Missing columns added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Addition failed:', error.message);
    process.exit(1);
  });