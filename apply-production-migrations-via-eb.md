# Production Migration Deployment Guide
## PR #6: Model Answer Integration

Since direct database access is restricted, we'll deploy migrations via Elastic Beanstalk.

## ⚠️ CRITICAL: Run These Migrations BEFORE Merging PR #6

### Option 1: Deploy Migration Script to Production EB (Recommended)

#### Step 1: Create a temporary migration bundle

```bash
# Create migration bundle
zip -r pr6-migrations.zip run-production-migrations.js package.json

# Upload to S3
aws s3 cp pr6-migrations.zip s3://elasticbeanstalk-ap-southeast-1-$(aws sts get-caller-identity --query Account --output text)/p3-interview-academy/pr6-migrations.zip

# SSH into EB instance and run
aws elasticbeanstalk describe-environment-resources \
  --environment-name p3-interview-academy-prod-v2 \
  --query 'EnvironmentResources.Instances[0].Id' \
  --output text
```

#### Step 2: Use AWS Systems Manager Session Manager

```bash
# Start session
aws ssm start-session --target <instance-id-from-above>

# Once in the instance:
cd /var/app/current
node run-production-migrations.js
```

### Option 2: Add Security Group Rule Temporarily

#### Step 1: Get current security group

```bash
aws elasticbeanstalk describe-configuration-settings \
  --application-name p3-interview-academy \
  --environment-name p3-interview-academy-prod-v2 \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:autoscaling:launchconfiguration`]'
```

#### Step 2: Add your IP to RDS security group

```bash
# Get RDS security group ID
aws rds describe-db-instances \
  --db-instance-identifier p3interviewacademy \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text

# Add your IP (121.7.122.45)
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id-from-above> \
  --protocol tcp \
  --port 5432 \
  --cidr 121.7.122.45/32 \
  --region ap-southeast-1
```

#### Step 3: Run migrations locally

```bash
node run-production-migrations.js
```

#### Step 4: Remove your IP from security group

```bash
aws ec2 revoke-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 5432 \
  --cidr 121.7.122.45/32 \
  --region ap-southeast-1
```

### Option 3: Use EB .ebextensions Hook (Most Automated)

Create `.ebextensions/99-run-migrations.config`:

```yaml
container_commands:
  01_run_pr6_migrations:
    command: "node run-production-migrations.js"
    leader_only: true
    ignoreErrors: false
```

Then deploy - migrations run automatically before app starts.

**⚠️ WARNING**: This runs migrations on EVERY deployment. Remove this file after PR #6 is deployed.

## Recommended Approach

**Use Option 2** (temporary security group rule):

1. Safest for one-time migrations
2. Allows verification before deployment
3. Easy to audit and rollback
4. No persistent security changes

## Verification After Migration

```bash
# Check columns exist
node deployment-scripts/util/check-production-schema.js
```

## Rollback Plan

If migrations fail:
1. DO NOT deploy application code
2. Contact DBA to inspect database state
3. Manual cleanup may be required
4. Use database backup if needed

## Timeline

- **Migration Duration**: ~30 seconds
- **Security Group Update**: ~5 minutes
- **Verification**: ~2 minutes
- **Total**: ~8-10 minutes
