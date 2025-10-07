#!/usr/bin/env node
// Standalone schema deployment script for AWS EB production environment
// This script will be uploaded to the production server and executed there

const { Pool } = require('pg');
const fs = require('fs');

// Database connection using environment DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQL for creating practice_sessions table
const CREATE_PRACTICE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS practice_sessions (
  id SERIAL PRIMARY KEY,
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

// SQL for creating practice_messages table
const CREATE_PRACTICE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS practice_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
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

// SQL for creating practice_reports table
const CREATE_PRACTICE_REPORTS_TABLE = `
CREATE TABLE IF NOT EXISTS practice_reports (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
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
    console.log('🗃️ Starting database schema deployment...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // Test connection
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected:', result.rows[0].version.substring(0, 50) + '...');

    // Create tables
    console.log('📋 Creating practice_sessions table...');
    await client.query(CREATE_PRACTICE_SESSIONS_TABLE);
    console.log('✅ practice_sessions table created');

    console.log('📋 Creating practice_messages table...');
    await client.query(CREATE_PRACTICE_MESSAGES_TABLE);
    console.log('✅ practice_messages table created');

    console.log('📋 Creating practice_reports table...');
    await client.query(CREATE_PRACTICE_REPORTS_TABLE);
    console.log('✅ practice_reports table created');

    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'practice_%'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:', tables.rows.map(r => r.table_name));

    console.log('🎉 Schema deployment completed successfully!');

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
    console.log('✨ Database schema deployment successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });