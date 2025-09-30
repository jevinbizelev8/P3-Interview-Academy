// Check deployment status and logs
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand, DescribeEventsCommand } from '@aws-sdk/client-elastic-beanstalk';

const awsConfig = {
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: 'AKIAWCHYHHICYOWB626U',
    secretAccessKey: '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'
  }
};

const ENVIRONMENT_NAME = 'p3-interview-academy-prod-v2';
const ebClient = new ElasticBeanstalkClient(awsConfig);

async function checkDeploymentStatus() {
  try {
    console.log('📊 Checking deployment status...');

    // Get environment status
    const envResponse = await ebClient.send(new DescribeEnvironmentsCommand({
      EnvironmentNames: [ENVIRONMENT_NAME]
    }));

    const environment = envResponse.Environments?.[0];
    console.log(`Environment: ${environment?.Status} (Health: ${environment?.Health})`);
    console.log(`Version: ${environment?.VersionLabel}`);

    // Get recent events
    console.log('📝 Recent deployment events:');
    const eventsResponse = await ebClient.send(new DescribeEventsCommand({
      EnvironmentName: ENVIRONMENT_NAME,
      MaxRecords: 10
    }));

    const events = eventsResponse.Events || [];
    events.reverse().forEach(event => {
      const timestamp = event.EventDate?.toLocaleString() || 'Unknown';
      const severity = event.Severity || 'INFO';
      const message = event.Message || 'No message';

      console.log(`[${timestamp}] ${severity}: ${message}`);
    });

  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
  }
}

checkDeploymentStatus();