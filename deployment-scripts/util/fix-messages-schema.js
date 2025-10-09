// Fix practice_messages schema to include missing timestamp column
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const ADD_TIMESTAMP_COLUMN = `
ALTER TABLE practice_messages
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
`;

async function fixMessagesSchema() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing practice_messages schema...');

    // Add missing timestamp column
    console.log('📋 Adding timestamp column to practice_messages...');
    await client.query(ADD_TIMESTAMP_COLUMN);
    console.log('✅ Timestamp column added');

    // Verify the fix
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_messages'
      ORDER BY ordinal_position;
    `);

    console.log('📊 practice_messages columns after fix:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Schema fix completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run fix
fixMessagesSchema()
  .then(() => {
    console.log('✨ Schema fix successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error.message);
    process.exit(1);
  });