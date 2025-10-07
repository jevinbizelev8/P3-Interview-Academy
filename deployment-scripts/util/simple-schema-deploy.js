// Simple schema deployment using pg directly
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const PRACTICE_SESSIONS_SQL = `
CREATE TABLE IF NOT EXISTS practice_sessions (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-session-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  user_id VARCHAR(255) NOT NULL,
  scenario_id VARCHAR(255) NOT NULL,
  interview_stage VARCHAR(100) NOT NULL,
  job_position VARCHAR(255),
  company_name VARCHAR(255),
  difficulty_level VARCHAR(50) DEFAULT 'intermediate',
  preferred_language VARCHAR(10) DEFAULT 'en',
  total_questions INTEGER DEFAULT 20,
  current_question_number INTEGER DEFAULT 1,
  session_status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  overall_score DECIMAL(5,2),
  feedback_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const PRACTICE_MESSAGES_SQL = `
CREATE TABLE IF NOT EXISTS practice_messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-message-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  question_number INTEGER,
  response_time INTEGER,
  star_score DECIMAL(5,2),
  feedback TEXT,
  cultural_context TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const PRACTICE_REPORTS_SQL = `
CREATE TABLE IF NOT EXISTS practice_reports (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-report-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL,
  star_breakdown JSONB,
  detailed_feedback TEXT,
  strengths TEXT[],
  improvement_areas TEXT[],
  recommendations TEXT[],
  cultural_insights TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function deploySchema() {
  const client = await pool.connect();

  try {
    console.log('🗃️ Starting simple schema deployment...');

    // Test connection
    const connectionTest = await client.query('SELECT version() as db_version');
    console.log('✅ Database connected:', connectionTest.rows[0].db_version.substring(0, 50) + '...');

    // Create practice_sessions table
    console.log('📋 Creating practice_sessions table...');
    await client.query(PRACTICE_SESSIONS_SQL);
    console.log('✅ practice_sessions table created');

    // Create practice_messages table
    console.log('📋 Creating practice_messages table...');
    await client.query(PRACTICE_MESSAGES_SQL);
    console.log('✅ practice_messages table created');

    // Create practice_reports table
    console.log('📋 Creating practice_reports table...');
    await client.query(PRACTICE_REPORTS_SQL);
    console.log('✅ practice_reports table created');

    // Verify tables
    const tables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'practice_%'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    console.log('🎉 Schema deployment completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run deployment
deploySchema()
  .then(() => {
    console.log('✨ Simple schema deployment successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });