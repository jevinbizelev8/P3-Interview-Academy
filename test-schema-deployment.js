// Test script to deploy schema via production server
const https = require('https');

const deploySchema = async () => {
  console.log('🗃️ Attempting schema deployment via production server...');

  const postData = JSON.stringify({
    action: 'deploy-schema',
    timestamp: new Date().toISOString()
  });

  const options = {
    hostname: 'p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com',
    port: 80,
    path: '/api/test-deploy-schema',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Schema deployment successful!');
            console.log('Output:', response.output);
            resolve(response);
          } else {
            console.error('❌ Schema deployment failed:', response.error);
            console.error('Output:', response.output);
            reject(new Error(response.error));
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

    req.write(postData);
    req.end();
  });
};

deploySchema()
  .then(() => {
    console.log('🎉 Schema deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema deployment failed:', error.message);
    process.exit(1);
  });