// HTTP-based schema deployment using production server's own database access
const http = require('http');

const deploySchemaViaHTTP = () => {
  console.log('🌐 Deploying schema via HTTP request to production server...');

  // Create a custom request that will run on the production server
  const postData = JSON.stringify({
    sql: `
      -- Create practice_sessions table
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

      -- Create practice_messages table
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

      -- Create practice_reports table
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
    `,
    action: 'deploy-schema'
  });

  const options = {
    hostname: 'p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com',
    port: 80,
    path: '/api/test-database-operation', // We need to create this endpoint
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
};

deploySchemaViaHTTP()
  .then(response => {
    console.log('✅ Schema deployment response:', response);
  })
  .catch(error => {
    console.error('❌ Schema deployment failed:', error.message);
  });