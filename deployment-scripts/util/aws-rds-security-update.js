// AWS CLI commands to update RDS security group
import { execSync } from 'child_process';

// AWS Configuration - CREDENTIALS REMOVED FOR SECURITY
// Use AWS CLI profile or environment variables configured externally
// DO NOT commit credentials to version control
process.env.AWS_DEFAULT_REGION = 'ap-southeast-1';

async function updateRDSSecurityGroup() {
  try {
    console.log('🔍 Finding RDS instance and security group...');

    // Find RDS instance
    console.log('📋 Looking for RDS instances...');
    const rdsInstances = execSync(`
      aws rds describe-db-instances \
        --query 'DBInstances[?contains(Endpoint.Address, \`p3interviewacademy\`)].{
          DBInstanceIdentifier:DBInstanceIdentifier,
          Endpoint:Endpoint.Address,
          Port:Endpoint.Port,
          VpcSecurityGroups:VpcSecurityGroups
        }' \
        --output json
    `, { encoding: 'utf8' });

    const instances = JSON.parse(rdsInstances);
    console.log('Found RDS instances:', JSON.stringify(instances, null, 2));

    if (instances.length === 0) {
      throw new Error('No RDS instance found matching p3interviewacademy');
    }

    const rdsInstance = instances[0];
    const securityGroups = rdsInstance.VpcSecurityGroups;

    console.log(`✅ Found RDS instance: ${rdsInstance.DBInstanceIdentifier}`);
    console.log(`📍 Endpoint: ${rdsInstance.Endpoint}:${rdsInstance.Port}`);

    // Get the first security group (usually the main one)
    if (securityGroups.length === 0) {
      throw new Error('No security groups found for RDS instance');
    }

    const securityGroupId = securityGroups[0].VpcSecurityGroupId;
    console.log(`🔐 Security Group ID: ${securityGroupId}`);

    // Get current IP address
    console.log('🌐 Getting current IP address...');
    let currentIP;
    try {
      currentIP = execSync('curl -s https://ipinfo.io/ip', { encoding: 'utf8' }).trim();
    } catch (error) {
      currentIP = '35.227.103.23'; // Fallback to the IP we saw in logs
    }
    console.log(`📍 Current IP: ${currentIP}`);

    // Check existing security group rules
    console.log('📋 Checking existing security group rules...');
    const existingRules = execSync(`
      aws ec2 describe-security-groups \
        --group-ids ${securityGroupId} \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==\`5432\`]' \
        --output json
    `, { encoding: 'utf8' });

    const rules = JSON.parse(existingRules);
    console.log('Existing PostgreSQL rules:', JSON.stringify(rules, null, 2));

    // Add rule for current IP
    console.log(`🔓 Adding security group rule for IP ${currentIP}/32...`);

    try {
      const result = execSync(`
        aws ec2 authorize-security-group-ingress \
          --group-id ${securityGroupId} \
          --protocol tcp \
          --port 5432 \
          --cidr ${currentIP}/32 \
          --output json
      `, { encoding: 'utf8' });

      console.log('✅ Security group rule added successfully!');
      console.log('Result:', result);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Rule already exists for this IP');
      } else {
        throw error;
      }
    }

    // Also try adding a backup rule for the Replit IP range
    console.log('🔓 Adding backup rule for Replit IP range...');
    try {
      const backupResult = execSync(`
        aws ec2 authorize-security-group-ingress \
          --group-id ${securityGroupId} \
          --protocol tcp \
          --port 5432 \
          --cidr 35.227.103.0/24 \
          --output json
      `, { encoding: 'utf8' });

      console.log('✅ Backup security group rule added!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Backup rule already exists');
      } else {
        console.log('⚠️ Backup rule failed (not critical):', error.message);
      }
    }

    // Verify the rules were added
    console.log('🔍 Verifying updated security group rules...');
    const updatedRules = execSync(`
      aws ec2 describe-security-groups \
        --group-ids ${securityGroupId} \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==\`5432\`]' \
        --output json
    `, { encoding: 'utf8' });

    const newRules = JSON.parse(updatedRules);
    console.log('✅ Updated PostgreSQL rules:', JSON.stringify(newRules, null, 2));

    console.log('🎉 RDS security group updated successfully!');
    console.log('🗃️ You can now deploy the database schema');

    return {
      securityGroupId,
      currentIP,
      rdsEndpoint: rdsInstance.Endpoint,
      port: rdsInstance.Port
    };

  } catch (error) {
    console.error('❌ Failed to update RDS security group:', error.message);
    console.error('Error output:', error.stderr || error.stdout || '');
    throw error;
  }
}

// Run the security group update
updateRDSSecurityGroup()
  .then((result) => {
    console.log('✨ Security group update completed!');
    console.log('📋 Connection details:');
    console.log(`  - RDS Endpoint: ${result.rdsEndpoint}:${result.port}`);
    console.log(`  - Security Group: ${result.securityGroupId}`);
    console.log(`  - Allowed IP: ${result.currentIP}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Security group update failed:', error.message);
    process.exit(1);
  });