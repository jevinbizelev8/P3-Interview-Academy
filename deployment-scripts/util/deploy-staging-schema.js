import pg from 'pg';

const client = new pg.Client({
  host: 'p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com',
  user: 'app_user',
  password: 'ZgVs0A8jEJurQezzkp37txtJ',
  database: 'p3_staging',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function deploySchema() {
  try {
    await client.connect();
    console.log('✅ Connected to p3_staging database');

    // Create all tables based on the schema
    const schemaSql = `
      -- Users table with email verification fields
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        google_id VARCHAR(255) UNIQUE,
        auth_provider VARCHAR(20) DEFAULT 'local'
      );

      -- Interview scenarios
      CREATE TABLE IF NOT EXISTS interview_scenarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        industry VARCHAR(100),
        role VARCHAR(100),
        difficulty VARCHAR(50),
        stage VARCHAR(50),
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Interview sessions
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scenario_id UUID REFERENCES interview_scenarios(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'in_progress',
        overall_score INTEGER,
        feedback TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_question_number INTEGER DEFAULT 1,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Interview messages
      CREATE TABLE IF NOT EXISTS interview_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        question_number INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Sessions table for auth
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      );

      -- Practice sessions
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        job_position VARCHAR(255),
        interview_stage VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        overall_score INTEGER,
        feedback TEXT,
        current_question_number INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Practice messages
      CREATE TABLE IF NOT EXISTS practice_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        question_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Practice reports
      CREATE TABLE IF NOT EXISTS practice_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
        overall_score INTEGER,
        strengths TEXT,
        areas_for_improvement TEXT,
        detailed_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI Prepare sessions
      CREATE TABLE IF NOT EXISTS ai_prepare_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        job_position VARCHAR(255),
        interview_stage VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI Prepare questions
      CREATE TABLE IF NOT EXISTS ai_prepare_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ai_prepare_sessions(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_number INTEGER,
        category VARCHAR(100),
        difficulty VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI Prepare responses
      CREATE TABLE IF NOT EXISTS ai_prepare_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES ai_prepare_questions(id) ON DELETE CASCADE,
        user_response TEXT,
        ai_feedback TEXT,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
      CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_prepare_sessions_user_id ON ai_prepare_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
    `;

    console.log('📋 Deploying schema to p3_staging...');
    await client.query(schemaSql);
    console.log('✅ Schema deployed successfully!');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n✅ Staging database is ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploySchema();
