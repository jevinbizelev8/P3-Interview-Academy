// Check actual columns in ai_prepare_sessions table
const { Pool } = require('pg');
require('dotenv').config();

async function checkColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_prepare_sessions'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    console.log('Actual columns in ai_prepare_sessions:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();