// Deploy correct schema matching the Drizzle definitions
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Correct SQL matching the Drizzle schema exactly
const DROP_INCORRECT_TABLES = `
DROP TABLE IF EXISTS practice_reports CASCADE;
DROP TABLE IF EXISTS practice_messages CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
`;

const PRACTICE_SESSIONS_SQL = `
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  scenario_id VARCHAR(255) NOT NULL,
  job_position VARCHAR(200),
  company_name VARCHAR(200),
  interview_stage VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate',
  preferred_language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'active',
  current_question_number INTEGER DEFAULT 1,
  total_questions INTEGER DEFAULT 25,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_duration INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const PRACTICE_MESSAGES_SQL = `
CREATE TABLE practice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user_response', 'ai_question')),
  content TEXT NOT NULL,
  question_number INTEGER,
  input_method VARCHAR(20) DEFAULT 'text',
  language VARCHAR(10) DEFAULT 'en',
  response_time INTEGER,
  star_score DECIMAL(5,2),
  feedback TEXT,
  cultural_context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const PRACTICE_REPORTS_SQL = `
CREATE TABLE practice_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  overall_score DECIMAL(5,2),
  relevance_score DECIMAL(5,2),
  star_structure_score DECIMAL(5,2),
  specific_evidence_score DECIMAL(5,2),
  role_alignment_score DECIMAL(5,2),
  outcome_oriented_score DECIMAL(5,2),
  communication_score DECIMAL(5,2),
  problem_solving_score DECIMAL(5,2),
  cultural_fit_score DECIMAL(5,2),
  learning_agility_score DECIMAL(5,2),
  situation_score DECIMAL(5,2),
  task_score DECIMAL(5,2),
  action_score DECIMAL(5,2),
  result_score DECIMAL(5,2),
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  detailed_feedback TEXT,
  cultural_insights TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_practice_messages_session_id ON practice_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_messages_type ON practice_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_practice_reports_session_id ON practice_reports(session_id);
`;

async function deployCorrectSchema() {
  const client = await pool.connect();

  try {
    console.log('🗃️ Starting correct schema deployment...');

    // Test connection
    const connectionTest = await client.query('SELECT version() as db_version');
    console.log('✅ Database connected:', connectionTest.rows[0].db_version.substring(0, 50) + '...');

    // Drop existing incorrect tables
    console.log('🧹 Dropping incorrect tables...');
    await client.query(DROP_INCORRECT_TABLES);
    console.log('✅ Incorrect tables dropped');

    // Create practice_sessions table with correct schema
    console.log('📋 Creating correct practice_sessions table...');
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

    // Create indexes
    console.log('📋 Creating indexes...');
    await client.query(CREATE_INDEXES);
    console.log('✅ Indexes created');

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

    // Verify columns in practice_sessions
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'practice_sessions'
      ORDER BY ordinal_position;
    `);

    console.log('📊 practice_sessions columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Correct schema deployment completed successfully!');
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
deployCorrectSchema()
  .then(() => {
    console.log('✨ Correct schema deployment successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });