// Verification script for Phase 1 database schema
const { Pool } = require('pg');
require('dotenv').config();

async function verifyPhase1Schema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Phase 1 Database Schema Verification\n');

    // Test 1: Verify new tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'ai_prepare_sessions', 
        'ai_prepare_questions', 
        'ai_prepare_responses', 
        'ai_prepare_analytics'
      )
      ORDER BY table_name;
    `;
    
    const tables = await pool.query(tablesQuery);
    console.log('✅ New AI Prepare Tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    if (tables.rows.length !== 4) {
      throw new Error(`Expected 4 tables, found ${tables.rows.length}`);
    }

    // Test 2: Verify ai_prepare_sessions structure
    const sessionsColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_prepare_sessions'
      ORDER BY ordinal_position;
    `;
    
    const sessionColumns = await pool.query(sessionsColumnsQuery);
    console.log('\n✅ ai_prepare_sessions structure:');
    
    const requiredFields = [
      'id', 'user_id', 'job_position', 'company_name', 
      'interview_stage', 'experience_level', 'preferred_language',
      'voice_enabled', 'speech_rate', 'difficulty_level'
    ];
    
    const existingColumns = sessionColumns.rows.map(row => row.column_name);
    const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log(`   - ${existingColumns.length} columns created successfully`);

    // Test 3: Verify foreign key relationships
    const foreignKeysQuery = `
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name LIKE 'ai_prepare_%';
    `;
    
    const foreignKeys = await pool.query(foreignKeysQuery);
    console.log('\n✅ Foreign Key Relationships:');
    foreignKeys.rows.forEach(row => {
      console.log(`   - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Test 4: Verify JSONB fields are properly configured
    const jsonbFieldsQuery = `
      SELECT table_name, column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name LIKE 'ai_prepare_%' 
      AND data_type = 'jsonb'
      ORDER BY table_name, column_name;
    `;
    
    const jsonbFields = await pool.query(jsonbFieldsQuery);
    console.log('\n✅ JSONB Fields Configuration:');
    jsonbFields.rows.forEach(row => {
      console.log(`   - ${row.table_name}.${row.column_name} (default: ${row.column_default || 'NULL'})`);
    });

    // Test 5: Insert sample data to verify constraints
    console.log('\n🧪 Testing Data Insertion:');
    
    const testInsert = `
      INSERT INTO ai_prepare_sessions (
        user_id, job_position, interview_stage, experience_level, 
        preferred_language, voice_enabled, difficulty_level
      ) VALUES (
        'test-user-id', 'Software Engineer', 'phone-screening', 'intermediate',
        'en', true, 'adaptive'
      ) RETURNING id;
    `;
    
    const insertResult = await pool.query(testInsert);
    const testSessionId = insertResult.rows[0].id;
    console.log(`   - Test session created: ${testSessionId}`);

    // Clean up test data
    await pool.query('DELETE FROM ai_prepare_sessions WHERE user_id = $1', ['test-user-id']);
    console.log('   - Test data cleaned up');

    console.log('\n🎉 Phase 1 Database Schema Verification: PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Phase 1 Database Schema Verification: FAILED');
    console.error('Error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

verifyPhase1Schema().then(success => {
  process.exit(success ? 0 : 1);
});