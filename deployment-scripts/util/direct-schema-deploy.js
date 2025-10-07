// Direct schema deployment - uses production server's database connection
// This script will manually execute the SQL to create missing tables

import { executeQuery } from './dist/db.js';

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

const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_practice_messages_session_id ON practice_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_messages_type ON practice_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_practice_reports_session_id ON practice_reports(session_id);
`;

async function deploySchema() {
  try {
    console.log('🗃️ Starting direct schema deployment...');

    // Test database connection
    console.log('🔍 Testing database connection...');
    const connectionTest = await executeQuery('SELECT version() as db_version');
    console.log('✅ Database connected:', connectionTest[0].db_version.substring(0, 50) + '...');

    // Create practice_sessions table
    console.log('📋 Creating practice_sessions table...');
    await executeQuery(PRACTICE_SESSIONS_SQL);
    console.log('✅ practice_sessions table created');

    // Create practice_messages table
    console.log('📋 Creating practice_messages table...');
    await executeQuery(PRACTICE_MESSAGES_SQL);
    console.log('✅ practice_messages table created');

    // Create practice_reports table
    console.log('📋 Creating practice_reports table...');
    await executeQuery(PRACTICE_REPORTS_SQL);
    console.log('✅ practice_reports table created');

    // Create indexes
    console.log('📋 Creating indexes...');
    await executeQuery(INDEXES_SQL);
    console.log('✅ Indexes created');

    // Verify tables
    console.log('🔍 Verifying created tables...');
    const tables = await executeQuery(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'practice_%'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    console.log('🎉 Schema deployment completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
if (process.env.DATABASE_URL) {
  deploySchema()
    .then(() => {
      console.log('✨ Direct schema deployment successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error.message);
      process.exit(1);
    });
} else {
  console.error('❌ DATABASE_URL not set. Please set the database connection string.');
  process.exit(1);
}