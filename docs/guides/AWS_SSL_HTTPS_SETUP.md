# AWS SSL/HTTPS Setup Guide for Elastic Beanstalk

**Purpose**: Enable HTTPS on Elastic Beanstalk environments to support Stripe webhook endpoints
**Environments**: Staging (`p3-interview-academy-staging`) and Production (`p3-interview-academy-prod-v2`)
**Document Version**: 1.0
**Last Updated**: 2025-10-23

---

## 🎯 Why This Is Needed

**Problem**: Stripe requires HTTPS URLs for webhook endpoints. Current environment URLs use HTTP only:
- ❌ `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- ❌ `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

**Solution**: Configure Elastic Beanstalk load balancer with SSL/HTTPS support:
- ✅ `https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- ✅ `https://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

---

## 📋 Prerequisites

- [x] AWS CLI configured with appropriate credentials
- [x] Access to Elastic Beanstalk environments (staging and production)
- [x] Elastic Beanstalk environments using load balancer (not single instance)
- [x] Approximately 30-45 minutes for setup

---

## 🚀 Option 1: Enable HTTPS via AWS Console (Recommended for Beginners)

### Step 1: Verify Load Balancer Configuration

1. Go to [Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk)
2. Select Region: **ap-southeast-1** (Singapore)
3. Click on **`p3-interview-academy-staging`** environment
4. Click **Configuration** in left sidebar
5. Scroll to **Load balancer** section → Click **Edit**

**Verify**:
- Load balancer type: `Application Load Balancer` (ALB) or `Classic Load Balancer`
- If "Single instance" → Must upgrade to load-balanced environment first (see troubleshooting)

---

### Step 2: Add HTTPS Listener

**In the Load Balancer Configuration page:**

1. Scroll to **Listeners** section
2. Click **Add listener**
3. Configure:
   - **Port**: `443`
   - **Protocol**: `HTTPS`
   - **SSL certificate**: Select **AWS Certificate Manager (ACM)**
   - Click **Add certificate**

---

### Step 3: Request SSL Certificate (ACM)

**Option A: Use Elastic Beanstalk's Managed Certificate (Easiest)**

Some EB regions support automatic certificates. If available:
1. Select **"Create a new ACM certificate"**
2. Domain: `*.elasticbeanstalk.com` or specific environment URL
3. Validation: Automatic (EB handles this)
4. Click **Request certificate**
5. Wait 5-10 minutes for certificate to be issued

**Option B: Manual ACM Certificate Request (Most Common)**

1. Open new tab → Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm)
2. **Important**: Switch region to **ap-southeast-1** (Singapore) - same as EB environment
3. Click **Request certificate** → **Request a public certificate**
4. Add domain names:
   ```
   p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
   ```
5. Validation method: **DNS validation** (recommended) or **Email validation**
6. Click **Request**

---

### Step 4: Validate Certificate Ownership

#### DNS Validation (Recommended):

1. Certificate status shows **"Pending validation"**
2. Click on the certificate ID
3. Click **Create records in Route 53** (if domain is in Route 53)
   - Or manually add CNAME records shown to your DNS provider

**For elasticbeanstalk.com domains**:
- You cannot add DNS records (AWS-owned domain)
- **Solution**: Use email validation instead, or request certificate for custom domain

#### Email Validation (Alternative):

1. AWS sends validation email to:
   - admin@elasticbeanstalk.com (AWS receives this)
   - Or domain admin email

**For elasticbeanstalk.com domains**:
- Email validation won't work (AWS-owned domain)
- **Solution**: Use Option 2 (AWS CLI) to bypass validation

---

### Step 5: Attach Certificate to Load Balancer

1. Go back to **Elastic Beanstalk** → **Configuration** → **Load balancer**
2. In **Listeners** section, edit the HTTPS:443 listener
3. **SSL certificate**: Select the ACM certificate you created
4. **Default process**: Select your application process (usually `default`)
5. Click **Apply**

---

### Step 6: Update Security Group (if needed)

1. Still in Load Balancer configuration
2. Scroll to **Security groups**
3. Ensure security group allows:
   - **Inbound**: Port 443 (HTTPS) from `0.0.0.0/0` (anywhere)
   - **Inbound**: Port 80 (HTTP) from `0.0.0.0/0` (optional, for redirect)

---

### Step 7: Save and Deploy

1. Click **Apply** at bottom of Load Balancer configuration page
2. Wait 5-10 minutes for environment update
3. Monitor status in EB console (should show "Updating environment")

---

### Step 8: Verify HTTPS Access

```bash
# Test HTTPS endpoint
curl https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T...",
  "environment": "staging"
}
```

**✅ Success**: HTTPS is working!
**❌ Error**: See troubleshooting section below

---

## 🚀 Option 2: Enable HTTPS via AWS CLI (Faster, Programmatic)

### Step 1: Check Current Load Balancer Type

```bash
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --application-name p3-interview-academy \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:environment`].{Name:OptionName,Value:Value}' \
  --output table
```

**Look for**: `EnvironmentType` should be `LoadBalanced` (not `SingleInstance`)

---

### Step 2: Get Load Balancer ARN

```bash
# Get load balancer name
LB_NAME=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name p3-interview-academy-staging \
  --query 'EnvironmentResources.LoadBalancers[0].Name' \
  --output text)

echo "Load Balancer: $LB_NAME"

# Get load balancer ARN (for ALB)
LB_ARN=$(aws elbv2 describe-load-balancers \
  --names $LB_NAME \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text 2>/dev/null)

# If using Classic Load Balancer, use:
# aws elb describe-load-balancers --load-balancer-names $LB_NAME
```

---

### Step 3: Request ACM Certificate

**⚠️ Important**: ACM certificate must be in the **same region** as your EB environment (ap-southeast-1).

#### For Custom Domain (Recommended):

```bash
# Request certificate for custom domain
aws acm request-certificate \
  --region ap-southeast-1 \
  --domain-name p3app.bizelev8.ai \
  --subject-alternative-names staging.p3app.bizelev8.ai \
  --validation-method DNS \
  --tags Key=Environment,Value=staging

# Get certificate ARN from output
CERT_ARN="arn:aws:acm:ap-southeast-1:ACCOUNT_ID:certificate/xxxxx-xxxx-xxxx-xxxx-xxxxx"
```

**Then validate**:
```bash
# Get DNS validation records
aws acm describe-certificate \
  --region ap-southeast-1 \
  --certificate-arn $CERT_ARN \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

Add the CNAME record to your DNS (Route 53, Cloudflare, etc.).

---

#### For elasticbeanstalk.com Domain (Workaround):

**Issue**: Cannot validate elasticbeanstalk.com domains via DNS or email.

**Workaround 1**: Import existing certificate:
```bash
# If you have a wildcard cert for *.elasticbeanstalk.com
aws acm import-certificate \
  --region ap-southeast-1 \
  --certificate fileb://certificate.pem \
  --private-key fileb://private-key.pem \
  --certificate-chain fileb://certificate-chain.pem
```

**Workaround 2**: Use custom domain instead (p3app.bizelev8.ai)

**Workaround 3**: Use AWS-provided load balancer certificate (see Step 4)

---

### Step 4: Configure HTTPS Listener on Load Balancer

#### For Application Load Balancer (ALB):

```bash
# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $LB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
```

**Get target group ARN**:
```bash
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --load-balancer-arn $LB_ARN \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
```

---

#### For Classic Load Balancer (CLB):

```bash
# Add HTTPS listener
aws elb create-load-balancer-listeners \
  --load-balancer-name $LB_NAME \
  --listeners "Protocol=HTTPS,LoadBalancerPort=443,InstanceProtocol=HTTP,InstancePort=80,SSLCertificateId=$CERT_ARN"
```

---

### Step 5: Update Security Group

```bash
# Get security group ID
SG_ID=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $LB_ARN \
  --query 'LoadBalancers[0].SecurityGroups[0]' \
  --output text)

# Add HTTPS inbound rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

### Step 6: (Optional) Configure HTTP to HTTPS Redirect

**For ALB only**:
```bash
# Get HTTP listener ARN
HTTP_LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn $LB_ARN \
  --query 'Listeners[?Port==`80`].ListenerArn' \
  --output text)

# Modify to redirect to HTTPS
aws elbv2 modify-listener \
  --listener-arn $HTTP_LISTENER \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

---

### Step 7: Verify HTTPS

```bash
# Test HTTPS
curl https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# Check certificate
curl -vI https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com 2>&1 | grep -i "SSL certificate"
```

---

## 🔧 Option 3: Use Elastic Beanstalk Configuration File

**Create**: `.ebextensions/04-ssl-https.config`

This file will be created separately and included in your repository. It enables HTTPS listener automatically on deployment.

**Benefits**:
- ✅ Configuration as code
- ✅ Automatic setup on new environments
- ✅ Version controlled

**Deploy**:
```bash
# Commit the new config file
git add .ebextensions/04-ssl-https.config
git commit -m "feat: Add HTTPS listener configuration"
git push

# Deploy to staging
eb deploy p3-interview-academy-staging
```

---

## 🧪 Verification Checklist

After HTTPS is enabled:

- [ ] **HTTPS health check passes**:
  ```bash
  curl https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
  ```
  Expected: HTTP 200

- [ ] **SSL certificate valid**:
  ```bash
  openssl s_client -connect p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com:443 -servername p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com | grep -i "verify return code"
  ```
  Expected: `Verify return code: 0 (ok)`

- [ ] **HTTP redirects to HTTPS** (if configured):
  ```bash
  curl -I http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
  ```
  Expected: HTTP 301 redirect to HTTPS

- [ ] **Stripe webhook URL accepted**:
  - Go to Stripe Dashboard → Webhooks
  - Try adding: `https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe`
  - Expected: URL accepted (no "Invalid URL" error)

---

## 🐛 Troubleshooting

### Issue 1: "Single Instance Environment - Cannot Add Listener"

**Symptom**: Load balancer configuration option is grayed out or missing.

**Cause**: Environment is running in single-instance mode (no load balancer).

**Solution**: Convert to load-balanced environment:

1. **Via Console**:
   - EB Console → Configuration → Capacity → Edit
   - Environment type: **Load balanced**
   - Min instances: 1, Max instances: 4
   - Apply (will take 10-15 minutes)

2. **Via CLI**:
   ```bash
   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-staging \
     --option-settings \
       Namespace=aws:elasticbeanstalk:environment,OptionName=EnvironmentType,Value=LoadBalanced \
       Namespace=aws:autoscaling:asg,OptionName=MinSize,Value=1 \
       Namespace=aws:autoscaling:asg,OptionName=MaxSize,Value=4
   ```

---

### Issue 2: "Certificate Validation Stuck in Pending"

**Symptom**: ACM certificate shows "Pending validation" for > 30 minutes.

**For DNS Validation**:
- Verify CNAME record added correctly to DNS
- Check DNS propagation: `dig _xxx.p3app.bizelev8.ai CNAME`
- Wait up to 72 hours (usually 5-30 minutes)

**For elasticbeanstalk.com Domains**:
- **Cannot validate** (AWS-owned domain)
- Use custom domain instead (p3app.bizelev8.ai)
- Or use EB managed certificate (if available in region)

---

### Issue 3: "SSL Certificate Error - Name Mismatch"

**Symptom**: Browser shows "Certificate name mismatch" warning.

**Cause**: Certificate issued for different domain than accessed URL.

**Solution**:
- Ensure certificate includes exact domain name or wildcard
- Example: Cert for `*.bizelev8.ai` works for `staging.bizelev8.ai`
- But cert for `p3app.bizelev8.ai` does NOT work for `staging.p3app.bizelev8.ai`

---

### Issue 4: "Connection Timeout on Port 443"

**Symptom**: `curl https://...` hangs or times out.

**Cause**: Security group not allowing HTTPS traffic.

**Solution**:
```bash
# Get load balancer security group
SG_ID=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $LB_ARN \
  --query 'LoadBalancers[0].SecurityGroups[0]' \
  --output text)

# Check current rules
aws ec2 describe-security-groups --group-ids $SG_ID

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

### Issue 5: "502 Bad Gateway on HTTPS"

**Symptom**: HTTPS returns 502, but HTTP works fine.

**Cause**: Backend instance target configuration incorrect.

**Solution**:
- Verify backend instances are healthy
- Check target group health:
  ```bash
  aws elbv2 describe-target-health \
    --target-group-arn $TARGET_GROUP_ARN
  ```
- Ensure backend process type set to `http` (not `https`)

---

## 📊 Cost Implications

### Free Tier:
- ✅ **ACM Certificates**: FREE (public certificates)
- ✅ **Load Balancer**: Included in EB environment cost
- ✅ **Data Transfer**: First 1 GB/month free

### Ongoing Costs:
- **Application Load Balancer**: ~$16-22/month per environment
- **Classic Load Balancer**: ~$18-25/month per environment
- **Data transfer**: $0.01-0.09/GB after free tier

**Total Estimate**: ~$20-30/month per environment with HTTPS enabled

---

## 🔐 Security Best Practices

- ✅ Use ACM-managed certificates (auto-renewal)
- ✅ Enable HTTP to HTTPS redirect
- ✅ Use TLS 1.2 or higher (default)
- ✅ Enable HSTS headers (add to app)
- ✅ Rotate certificates before expiration (ACM auto-renews)
- ✅ Monitor certificate expiration via CloudWatch

---

## 🚀 Next Steps After HTTPS is Enabled

1. **Update Stripe Webhook Configuration**:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Add endpoint: `https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe`
   - Expected: ✅ URL accepted

2. **Get Webhook Signing Secret**:
   - Copy `whsec_...` from Stripe dashboard
   - Add to environment variables: `STRIPE_TEST_WEBHOOK_SECRET`

3. **Repeat for Production**:
   - Follow same steps for `p3-interview-academy-prod-v2`
   - Use production Stripe account (live mode)
   - Get production webhook signing secret

4. **Proceed with Phase 6 Implementation**:
   - Now you have all required credentials
   - Implement Stripe integration
   - Test webhooks with HTTPS endpoints

---

## 📖 Additional Resources

- **AWS Certificate Manager**: https://docs.aws.amazon.com/acm/
- **Elastic Beanstalk HTTPS**: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https.html
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **SSL/TLS Best Practices**: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https-ssl.html

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Next Review**: After successful HTTPS setup
**For Questions**: Consult AWS documentation or team lead
