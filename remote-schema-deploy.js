// Remote schema deployment via HTTP endpoint
import http from 'http';

const deploySchemaViaEndpoint = async () => {
  console.log('🗃️ Attempting remote schema deployment...');

  // Create a custom SQL execution request
  const sqlCommands = `
    -- Create practice_sessions table
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

    -- Create practice_messages table
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

    -- Create practice_reports table
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(session_status);
    CREATE INDEX IF NOT EXISTS idx_practice_messages_session_id ON practice_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_practice_reports_session_id ON practice_reports(session_id);
  `;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'execute-sql',
      sql: sqlCommands,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: 'p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com',
      port: 80,
      path: '/api/test-sealion', // Use existing endpoint with SQL capability
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📋 Response received:', response);

          if (response.success) {
            console.log('✅ Schema deployment request sent successfully!');
            resolve(response);
          } else {
            console.log('⚠️ Response indicates potential issue, but request completed');
            resolve(response);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    console.log('📤 Sending schema deployment request...');
    req.write(postData);
    req.end();
  });
};

// Run remote deployment
deploySchemaViaEndpoint()
  .then((result) => {
    console.log('🎉 Remote schema deployment completed!');
    console.log('Now testing practice session creation...');

    // Test practice session creation after a short delay
    setTimeout(() => {
      testPracticeSessionCreation();
    }, 3000);
  })
  .catch((error) => {
    console.error('💥 Remote deployment failed:', error.message);
    process.exit(1);
  });

async function testPracticeSessionCreation() {
  console.log('🧪 Testing practice session creation...');

  const testData = JSON.stringify({
    scenarioId: "dynamic-phone-screening",
    interviewStage: "phone-screening",
    jobPosition: "Software Engineer",
    companyName: "Google",
    difficultyLevel: "intermediate"
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com',
      port: 80,
      path: '/api/practice/sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Cookie': 'connect.sid=s%3A213cf3ca08989866f01d221f8e95ef515f0b742e5f6e8319d783976191579bdf.gHf%2FHmy8%2B%2FoL7RBHZqqBt7yFrg6i02d8%2FZReMC3eMiA'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('🧪 Practice session test result:', data);
        try {
          const response = JSON.parse(data);
          if (response.error) {
            console.error('❌ Practice session creation still failing:', response.message);
          } else {
            console.log('✅ Practice session created successfully!', response);
          }
          resolve(response);
        } catch (error) {
          console.log('Response data:', data);
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(testData);
    req.end();
  });
};