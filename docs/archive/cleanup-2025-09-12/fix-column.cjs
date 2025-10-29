// Fix the column name to match compatibility
const { Pool } = require('pg');
require('dotenv').config();

async function fixColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Renaming target_language to preferred_language...');
    
    await pool.query(`
      ALTER TABLE ai_prepare_sessions 
      RENAME COLUMN target_language TO preferred_language;
    `);
    
    console.log('✅ Column renamed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumn();