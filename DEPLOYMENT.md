# P³ Interview Academy - Production Deployment Guide

This guide provides step-by-step instructions for deploying P³ Interview Academy to AWS Elastic Beanstalk.

## 🚨 Prerequisites

### Required Tools
- **Node.js 18+** - Application runtime
- **AWS CLI** - Configured with appropriate permissions
- **Git** - Version control (for source management)

### AWS Requirements
- **AWS Account** with Elastic Beanstalk permissions
- **PostgreSQL Database** (AWS RDS recommended)
- **Elastic Beanstalk Application** already created
- **S3 Bucket** for deployment artifacts (auto-created by EB)

### Database Setup
1. **PostgreSQL Database** accessible from your EB environment
2. **Database URL** in the format: `postgresql://username:password@host:port/database`
3. **Network access** configured (VPC, security groups, etc.)

## 🔧 Pre-Deployment Setup

### 1. Clone and Prepare Repository
```bash
git clone <repository-url>
cd p3-interview-academy
npm install
```

### 2. Configure Environment Variables
Run the interactive environment setup script:
```bash
chmod +x deployment-scripts/setup-environment-variables.sh
./deployment-scripts/setup-environment-variables.sh
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ characters)
- `NODE_ENV=production`
- `WS_ALLOWED_ORIGINS` - WebSocket CORS origins (`*` for dev, domains for prod)

**Optional API Keys:**
- `OPENAI_API_KEY` - For OpenAI GPT integration
- `SEALION_API_KEY` - For SeaLion AI integration
- `ANTHROPIC_API_KEY` - For Claude integration
- `GOOGLE_API_KEY` - For Vertex AI integration

### 3. Verify Database Connectivity
Test database connection and schema:
```bash
chmod +x deployment-scripts/verify-database.sh
./deployment-scripts/verify-database.sh
```

This script will:
- Test database connectivity
- Verify session table creation
- Check application schema status
- Test connection performance

### 4. Test Build Process
Verify the application builds correctly:
```bash
npm run build
```

Expected output:
- `dist/index.js` - Built backend server
- `dist/public/` - Built frontend assets

## 🚀 Deployment Process

### Method 1: Automated Deployment (Recommended)

#### Step 1: Create Deployment Bundle
```bash
chmod +x deployment-scripts/create-deployment-bundle.sh
./deployment-scripts/create-deployment-bundle.sh
```

This creates a timestamped deployment bundle (e.g., `p3-interview-academy-eb-20241201-143022.zip`)

#### Step 2: Deploy to Elastic Beanstalk
```bash
chmod +x deployment-scripts/deploy-to-eb.sh
./deployment-scripts/deploy-to-eb.sh
```

Or specify a specific bundle:
```bash
./deployment-scripts/deploy-to-eb.sh p3-interview-academy-eb-20241201-143022.zip
```

### Method 2: Manual Deployment

#### Step 1: Create Bundle Manually
```bash
npm run build
zip -r deployment-bundle.zip dist/ package.json package-lock.json .ebextensions/ shared/ node_modules/
```

#### Step 2: Upload to AWS
```bash
# Upload to S3
aws s3 cp deployment-bundle.zip s3://elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID/p3-interview-academy/

# Create application version
aws elasticbeanstalk create-application-version \
  --application-name p3-interview-academy \
  --version-label manual-v1 \
  --source-bundle S3Bucket=elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID,S3Key=p3-interview-academy/deployment-bundle.zip

# Deploy to environment
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label manual-v1
```

## 🔍 Post-Deployment Verification

### 1. Check Environment Status
```bash
chmod +x deployment-scripts/check-environment-status.sh
./deployment-scripts/check-environment-status.sh
```

### 2. Test Health Endpoints

**Simple Health Check (for load balancers):**
```bash
curl http://your-eb-app.region.elasticbeanstalk.com/api/health/simple
```

**Enhanced Health Check:**
```bash
curl http://your-eb-app.region.elasticbeanstalk.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T14:30:22.123Z",
  "environment": "production",
  "uptime": 157.234,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "environment": {
      "required": {
        "DATABASE_URL": true,
        "SESSION_SECRET": true
      }
    }
  }
}
```

### 3. Test Application Features
- Visit the application URL
- Test user authentication
- Verify AI services are working
- Check WebSocket connections
- Test voice features

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Environment Health: Red
**Symptoms:** Application not responding, 5xx errors

**Debug Steps:**
```bash
# Check recent events
aws elasticbeanstalk describe-events \
  --environment-name p3-interview-academy-prod-v2 \
  --max-items 10

# Check environment status
./deployment-scripts/check-environment-status.sh
```

**Common Causes:**
- Missing environment variables (DATABASE_URL, SESSION_SECRET)
- Database connectivity issues
- Build artifacts missing from deployment bundle

#### 2. Database Connection Errors
**Symptoms:** Health check shows database as unhealthy

**Debug Steps:**
```bash
# Test database connectivity
./deployment-scripts/verify-database.sh

# Check security groups and VPC configuration
# Ensure EB environment can reach database
```

**Solutions:**
- Verify DATABASE_URL format
- Check database server accessibility
- Verify credentials and permissions

#### 3. Static Files Not Serving
**Symptoms:** Frontend not loading, API works

**Causes:**
- `dist/public/` directory missing from bundle
- Build process failed
- Nginx configuration issues

**Solutions:**
- Rebuild with `npm run build`
- Verify `dist/public/index.html` exists
- Check `.ebextensions/01-nodejs.config` static file configuration

#### 4. WebSocket Connection Failures
**Symptoms:** Real-time features not working

**Solutions:**
- Set `WS_ALLOWED_ORIGINS=*` for testing
- Configure proper domain origins for production
- Check load balancer WebSocket support

### Log Access

#### Application Logs
```bash
# View recent logs
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/eb-docker/containers/eb-current-app

# Download logs bundle
aws elasticbeanstalk retrieve-environment-info \
  --environment-name p3-interview-academy-prod-v2 \
  --info-type tail
```

#### Health Check Logs
Access detailed diagnostics (requires authentication):
```bash
curl -H "Authorization: Bearer YOUR-TOKEN" \
  http://your-eb-app.region.elasticbeanstalk.com/api/diagnostics
```

## 🔄 Rollback Process

### Quick Rollback
```bash
# List recent application versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --max-items 10

# Rollback to previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label PREVIOUS-VERSION-LABEL
```

### Emergency Rollback
If the environment is severely degraded:
1. Use AWS Console for faster rollback
2. Monitor the environment status during rollback
3. Verify health checks after rollback completes

## 📊 Monitoring and Maintenance

### Regular Checks
- Monitor `/api/health` endpoint for system health
- Check AWS CloudWatch metrics
- Review application logs for errors
- Monitor database performance

### Environment Updates
```bash
# Check for available platform updates
aws elasticbeanstalk list-available-solution-stacks

# Apply platform updates during maintenance windows
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --solution-stack-name "NEW-PLATFORM-VERSION"
```

### Database Maintenance
- Regular backups (if using RDS)
- Monitor connection pool usage
- Run `npm run db:push` for schema updates (with caution in production)

## 🚨 Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use AWS Systems Manager Parameter Store for sensitive values
- Rotate secrets regularly (SESSION_SECRET, API keys)

### Database Security
- Use SSL connections (included in DATABASE_URL)
- Regular security patches
- Monitor access patterns

### Application Security
- Keep dependencies updated (`npm audit`)
- Monitor for security vulnerabilities
- Use HTTPS in production (configure ALB/CloudFront)

## 📞 Support and Emergency Contacts

### Issue Reporting
1. Check health endpoints first
2. Review application logs
3. Check this deployment guide
4. Contact system administrator if issues persist

### Useful Commands Reference
```bash
# Quick status check
./deployment-scripts/check-environment-status.sh

# Database verification
./deployment-scripts/verify-database.sh

# Create new deployment
./deployment-scripts/create-deployment-bundle.sh

# Deploy to production
./deployment-scripts/deploy-to-eb.sh

# Emergency rollback
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label LAST-KNOWN-GOOD-VERSION
```

---

**This deployment guide ensures reliable, repeatable production deployments for P³ Interview Academy.**