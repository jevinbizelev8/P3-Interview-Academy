# Database Credential Management Guide

**Last Updated**: 2025-12-02

This guide explains how to securely retrieve and use database credentials for P3 Interview Academy.

## Security First

**NEVER** hardcode database credentials in:
- Source code files
- Deployment scripts
- Documentation (use placeholders instead)
- Version control commits

**ALWAYS** use:
- Environment variables
- AWS Secrets Manager (recommended)
- AWS Elastic Beanstalk environment configuration
- Secure credential vaults

## Retrieving Database Credentials

### Method 1: AWS Elastic Beanstalk Environment Configuration (Recommended)

Retrieve credentials from the deployed environment:

```bash
# Staging Database Credentials
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`DATABASE_URL`].Value' \
  --output text

# Production Database Credentials
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-prod-v2 \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`DATABASE_URL`].Value' \
  --output text
```

### Method 2: AWS Secrets Manager (Future Implementation)

For enhanced security, credentials should be stored in AWS Secrets Manager:

```bash
# Retrieve staging credentials
aws secretsmanager get-secret-value \
  --secret-id p3-interview-academy/staging/database \
  --query 'SecretString' \
  --output text

# Retrieve production credentials
aws secretsmanager get-secret-value \
  --secret-id p3-interview-academy/production/database \
  --query 'SecretString' \
  --output text
```

### Method 3: Manual Retrieval from RDS Console

1. Log in to AWS Console
2. Navigate to RDS → Databases
3. Select `p3interviewacademy` database
4. View configuration details
5. Contact database administrator for password

**Database Connection Details**:
- **Host**: `p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com`
- **Port**: `5432`
- **Staging Database**: `p3_staging`
- **Production Database**: `postgres`
- **Staging User**: `app_user` or `app_user_staging`
- **Production User**: `app_user_prod`
- **Password**: [Contact AWS administrator or retrieve from EB config]

## Using Credentials in Scripts

All deployment and utility scripts should use environment variables:

```javascript
// Get database URL from environment variable
const dbUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable not set');
  console.error('Set it using: export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});
```

## Setting Environment Variables

### For Local Development

```bash
# Export staging credentials
export DATABASE_URL_STAGING='postgresql://app_user:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging'

# Export production credentials (use with caution!)
export DATABASE_URL_PRODUCTION='postgresql://app_user_prod:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres'
```

### For Deployment Scripts

Before running deployment scripts, set the required environment variables:

```bash
# For staging operations
export DATABASE_URL_STAGING="$(aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`DATABASE_URL`].Value' \
  --output text)"

# For production operations
export DATABASE_URL_PRODUCTION="$(aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-prod-v2 \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`DATABASE_URL`].Value' \
  --output text)"
```

## Connection String Format

```
postgresql://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require
```

Example with placeholders:
```
postgresql://app_user:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging?sslmode=require
```

## Security Best Practices

1. **Rotate Credentials Regularly**: Change database passwords every 90 days
2. **Use Least Privilege**: Grant only necessary permissions to database users
3. **Enable SSL**: Always use `sslmode=require` for connections
4. **Audit Access**: Monitor database access logs for suspicious activity
5. **Separate Environments**: Use different credentials for staging and production
6. **Never Commit Credentials**: Check all commits for exposed credentials
7. **Use IAM Authentication**: Consider AWS RDS IAM authentication (future improvement)

## Common Deployment Scripts

All scripts have been updated to use environment variables:

- `/deployment-scripts/util/add-external-transaction-id-column.js`
- `/deployment-scripts/util/verify-database-separation.js`
- `/deployment-scripts/util/verify-staging-connection.js`
- `/deployment-scripts/util/test-direct-db-insert.js`
- `/deployment-scripts/util/test-email-verification-complete.js`

## Troubleshooting

### Error: DATABASE_URL not set

**Solution**: Set the environment variable before running the script:
```bash
export DATABASE_URL_STAGING="postgresql://..."
```

### Error: Connection refused

**Possible causes**:
1. Security group not configured for your IP
2. Database not accessible from current network
3. Incorrect host or port

**Solution**: Contact AWS administrator to allowlist your IP in the RDS security group

### Error: Authentication failed

**Possible causes**:
1. Incorrect password
2. User does not have access to the specified database
3. Password has been rotated

**Solution**: Retrieve fresh credentials from AWS EB configuration or Secrets Manager

## References

- [AWS RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [SECURITY.md](../../SECURITY.md) - Project security guidelines

## Incident History

**2025-12-02**: Database credentials found hardcoded in 17+ files during security review. All instances removed and scripts updated to use environment variables. No credential compromise occurred (project not live yet).

## Support

For database access issues or credential retrieval assistance, contact:
- AWS Administrator: [Contact details in SECURITY.md]
- DevOps Team: [Contact details in SECURITY.md]
