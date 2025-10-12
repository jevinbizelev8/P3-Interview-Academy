// AWS SDK-based RDS security group update
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { EC2Client, DescribeSecurityGroupsCommand, AuthorizeSecurityGroupIngressCommand } from '@aws-sdk/client-ec2';
import https from 'https';

// AWS Configuration - Use environment variables or AWS CLI configuration
const awsConfig = {
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_ACCESS_KEY'
  }
};

// Initialize AWS clients
const rdsClient = new RDSClient(awsConfig);
const ec2Client = new EC2Client(awsConfig);

// Get current IP address
function getCurrentIP() {
  return new Promise((resolve, reject) => {
    https.get('https://ipinfo.io/ip', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

async function updateRDSSecurityGroup() {
  try {
    console.log('🔍 Finding RDS instance and security group...');

    // 1. Find RDS instances matching our database
    const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));

    const rdsInstance = rdsResponse.DBInstances?.find(instance =>
      instance.Endpoint?.Address?.includes('p3interviewacademy')
    );

    if (!rdsInstance) {
      throw new Error('RDS instance p3interviewacademy not found');
    }

    console.log(`✅ Found RDS instance: ${rdsInstance.DBInstanceIdentifier}`);
    console.log(`📍 Endpoint: ${rdsInstance.Endpoint?.Address}:${rdsInstance.Endpoint?.Port}`);

    // 2. Get security group information
    const vpcSecurityGroups = rdsInstance.VpcSecurityGroups || [];
    if (vpcSecurityGroups.length === 0) {
      throw new Error('No VPC security groups found for RDS instance');
    }

    const securityGroupId = vpcSecurityGroups[0].VpcSecurityGroupId;
    console.log(`🔐 Security Group ID: ${securityGroupId}`);

    // 3. Get current IP
    console.log('🌐 Getting current IP address...');
    const currentIP = await getCurrentIP();
    console.log(`📍 Current IP: ${currentIP}`);

    // 4. Check existing security group rules
    console.log('📋 Checking existing security group rules...');
    const securityGroupResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId]
    }));

    const securityGroup = securityGroupResponse.SecurityGroups?.[0];
    const existingRules = securityGroup?.IpPermissions?.filter(rule => rule.FromPort === 5432) || [];

    console.log('Existing PostgreSQL rules:', JSON.stringify(existingRules, null, 2));

    // 5. Add security group rule for current IP
    console.log(`🔓 Adding security group rule for ${currentIP}/32...`);

    try {
      await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: securityGroupId,
        IpPermissions: [{
          IpProtocol: 'tcp',
          FromPort: 5432,
          ToPort: 5432,
          IpRanges: [{
            CidrIp: `${currentIP}/32`,
            Description: 'Claude Code schema deployment access'
          }]
        }]
      }));

      console.log('✅ Security group rule added successfully!');
    } catch (error) {
      if (error.name === 'InvalidPermission.Duplicate') {
        console.log('⚠️ Rule already exists for this IP');
      } else {
        throw error;
      }
    }

    // 6. Add backup rule for broader IP range (in case IP changes)
    console.log('🔓 Adding backup rule for broader IP range...');
    try {
      const ipParts = currentIP.split('.');
      const networkCidr = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`;

      await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: securityGroupId,
        IpPermissions: [{
          IpProtocol: 'tcp',
          FromPort: 5432,
          ToPort: 5432,
          IpRanges: [{
            CidrIp: networkCidr,
            Description: 'Claude Code deployment network range'
          }]
        }]
      }));

      console.log(`✅ Backup rule added for network ${networkCidr}`);
    } catch (error) {
      if (error.name === 'InvalidPermission.Duplicate') {
        console.log('⚠️ Backup rule already exists');
      } else {
        console.log('⚠️ Backup rule failed (not critical):', error.message);
      }
    }

    // 7. Verify updated rules
    console.log('🔍 Verifying updated security group rules...');
    const updatedResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId]
    }));

    const updatedGroup = updatedResponse.SecurityGroups?.[0];
    const updatedRules = updatedGroup?.IpPermissions?.filter(rule => rule.FromPort === 5432) || [];

    console.log('✅ Updated PostgreSQL rules:');
    updatedRules.forEach((rule, index) => {
      console.log(`  Rule ${index + 1}:`);
      rule.IpRanges?.forEach(range => {
        console.log(`    - ${range.CidrIp}: ${range.Description || 'No description'}`);
      });
    });

    console.log('🎉 RDS security group updated successfully!');

    return {
      securityGroupId,
      currentIP,
      rdsEndpoint: rdsInstance.Endpoint?.Address,
      port: rdsInstance.Endpoint?.Port,
      dbInstanceId: rdsInstance.DBInstanceIdentifier
    };

  } catch (error) {
    console.error('❌ Failed to update RDS security group:', error.message);
    console.error('Error details:', error);
    throw error;
  }
}

// Run the security group update
updateRDSSecurityGroup()
  .then((result) => {
    console.log('✨ Security group update completed!');
    console.log('📋 Connection details:');
    console.log(`  - RDS Endpoint: ${result.rdsEndpoint}:${result.port}`);
    console.log(`  - DB Instance: ${result.dbInstanceId}`);
    console.log(`  - Security Group: ${result.securityGroupId}`);
    console.log(`  - Allowed IP: ${result.currentIP}`);
    console.log('🗃️ Ready for database schema deployment!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Security group update failed:', error.message);
    process.exit(1);
  });