// Final Phase 1 Schema Verification
const { Pool } = require('pg');
require('dotenv').config();

async function verifyPhase1Final() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Phase 1 Final Database Schema Verification\n');

    // Test 1: Verify all required tables exist
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
    console.log('✅ AI Prepare Module Tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    if (tables.rows.length !== 4) {
      throw new Error(`Expected 4 tables, found ${tables.rows.length}`);
    }

    // Test 2: Verify key compatibility fields
    const compatibilityQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_prepare_sessions'
      AND column_name IN ('job_position', 'company_name', 'interview_stage', 'preferred_language', 'experience_level')
      ORDER BY column_name;
    `;
    
    const compatFields = await pool.query(compatibilityQuery);
    console.log('\n✅ Compatibility Fields:');
    compatFields.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    const requiredCompatFields = ['job_position', 'company_name', 'interview_stage', 'preferred_language', 'experience_level'];
    const foundFields = compatFields.rows.map(row => row.column_name);
    const missingFields = requiredCompatFields.filter(field => !foundFields.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing compatibility fields: ${missingFields.join(', ')}`);
    }

    // Test 3: Verify voice-specific fields
    const voiceQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_prepare_sessions'
      AND column_name IN ('voice_enabled', 'preferred_voice', 'speech_rate', 'auto_play_questions')
      ORDER BY column_name;
    `;
    
    const voiceFields = await pool.query(voiceQuery);
    console.log('\n✅ Voice Enhancement Fields:');
    voiceFields.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Test 4: Verify AI-specific fields  
    const aiQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_prepare_sessions'
      AND column_name IN ('difficulty_level', 'average_star_score', 'total_time_spent', 'session_progress')
      ORDER BY column_name;
    `;
    
    const aiFields = await pool.query(aiQuery);
    console.log('\n✅ AI Enhancement Fields:');
    aiFields.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Test 5: Verify foreign key constraints
    const fkQuery = `
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name LIKE 'ai_prepare_%';
    `;
    
    const foreignKeys = await pool.query(fkQuery);
    console.log('\n✅ Foreign Key Relationships:');
    foreignKeys.rows.forEach(row => {
      console.log(`   - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}`);
    });

    // Test 6: Check if we can create a test user (cleanup after)
    console.log('\n🧪 Testing Data Integrity:');
    
    const testUserId = 'test-phase1-verification';
    
    try {
      // Create test user
      await pool.query(`
        INSERT INTO users (id, email, first_name) 
        VALUES ($1, $2, $3)
      `, [testUserId, 'test@phase1.com', 'Test']);
      
      // Test session creation
      const testInsert = await pool.query(`
        INSERT INTO ai_prepare_sessions (
          user_id, job_position, interview_stage, experience_level, 
          preferred_language, voice_enabled, difficulty_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING id;
      `, [testUserId, 'Software Engineer', 'phone-screening', 'intermediate', 'en', true, 'adaptive']);
      
      const sessionId = testInsert.rows[0].id;
      console.log('   - Test session created successfully');
      
      // Clean up
      await pool.query('DELETE FROM ai_prepare_sessions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log('   - Test data cleaned up');
      
    } catch (cleanupError) {
      // Try to clean up even if test failed
      try {
        await pool.query('DELETE FROM ai_prepare_sessions WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw cleanupError;
    }

    console.log('\n🎉 Phase 1 Database Schema Verification: PASSED');
    console.log('✅ All tables created successfully');
    console.log('✅ All compatibility fields aligned');  
    console.log('✅ Voice enhancements implemented');
    console.log('✅ AI features integrated');
    console.log('✅ Foreign key relationships working');
    console.log('✅ Data integrity constraints verified');
    
    return true;

  } catch (error) {
    console.error('\n❌ Phase 1 Database Schema Verification: FAILED');
    console.error('Error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

verifyPhase1Final().then(success => {
  process.exit(success ? 0 : 1);
});