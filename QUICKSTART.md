# Quick Start Guide: Deploy ZKP-Studio to AWS

This guide walks you through deploying ZKP-Studio to AWS in under 30 minutes.

## Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker installed
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Wave3 LLC AWS account access

## Step 1: Clone and Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/wave3ai/zkp-studio.git
cd zkp-studio

# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

echo "AWS Account ID: $AWS_ACCOUNT_ID"
```

## Step 2: Deploy Backend to AppRunner (10 minutes)

### Option A: Automated Script

```bash
./deploy.sh
# Choose option 1 (Backend only)
```

### Option B: Manual Steps

```bash
cd backend

# 1. Create ECR repository
aws ecr create-repository \
  --repository-name zkp-studio-backend \
  --region us-east-1

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and push Docker image
docker build -t zkp-studio-backend .
docker tag zkp-studio-backend:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest

# 4. Create App Runner service
aws apprunner create-service \
  --service-name zkp-studio-backend \
  --source-configuration file://apprunner-config.json \
  --instance-configuration '{"Cpu":"1 vCPU","Memory":"2 GB"}' \
  --region us-east-1
```

**Create `apprunner-config.json`:**
```json
{
  "ImageRepository": {
    "ImageIdentifier": "<YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "8000"
    }
  },
  "AutoDeploymentsEnabled": false
}
```

**Get your backend URL:**
```bash
aws apprunner list-services --region us-east-1
# Copy the ServiceUrl (e.g., https://xxx.us-east-1.awsapprunner.com)
```

**Test backend:**
```bash
curl https://YOUR-SERVICE-URL.awsapprunner.com/
# Should return: {"service":"ZKP-Studio API","status":"operational",...}
```

## Step 3: Deploy Frontend to Amplify (10 minutes)

### Option A: Amplify Console (Recommended)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/wave3ai/zkp-studio.git
   git push -u origin main
   ```

2. **Connect to Amplify:**
   - Go to: https://console.aws.amazon.com/amplify/
   - Click **"New app"** → **"Host web app"**
   - Choose **GitHub** and authorize
   - Select repository: `zkp-studio`
   - Select branch: `main`
   - Click **Next**

3. **Configure build:**
   - App name: `zkp-studio`
   - Environment: `prod`
   - Build settings (auto-detected):
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm install
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/build
         files:
           - '**/*'
     ```
   - Click **Next**

4. **Add environment variable:**
   - Under **Environment variables**, add:
     - Key: `REACT_APP_API_URL`
     - Value: `https://YOUR-BACKEND-URL.awsapprunner.com`
   - Click **Save and deploy**

5. **Configure custom domain (wave3ai.org):**
   - After deployment completes, go to **App settings** → **Domain management**
   - Click **Add domain**
   - Enter: `wave3ai.org`
   - Amplify will provide DNS records
   - Update your Route 53 DNS (it's already in AWS):
     ```bash
     # Get hosted zone ID
     aws route53 list-hosted-zones-by-name --dns-name wave3ai.org
     
     # Amplify will show CNAME record to add
     # Example: _abc123.wave3ai.org → _xyz456.acm-validations.aws
     ```
   - SSL certificate issued automatically (5-10 minutes)

### Option B: Amplify CLI

```bash
cd frontend

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init
# Follow prompts:
# - Name: zkpstudio
# - Environment: prod
# - Editor: (your choice)
# - App type: javascript
# - Framework: react
# - Build directory: build

# Add hosting
amplify add hosting
# Choose: "Hosting with Amplify Console"

# Configure environment
cat > .env << EOF
REACT_APP_API_URL=https://YOUR-BACKEND-URL.awsapprunner.com
EOF

# Deploy
amplify publish
```

## Step 4: Verify Deployment (5 minutes)

### Test Backend

```bash
# Health check
curl https://YOUR-BACKEND-URL.awsapprunner.com/

# Get engines
curl https://YOUR-BACKEND-URL.awsapprunner.com/engines

# Interactive docs
open https://YOUR-BACKEND-URL.awsapprunner.com/docs
```

### Test Frontend

1. Visit: `https://YOUR-AMPLIFY-URL.amplifyapp.com` or `https://wave3ai.org`
2. Try example policy: "Verify user is over 18 without revealing birthdate"
3. Click **Compile Policy to Circuit**
4. Click **Generate Zero-Knowledge Proof**
5. Click **Verify Proof**

### Check Logs

```bash
# Backend logs
aws logs tail /aws/apprunner/zkp-studio-backend --follow

# Frontend logs (in Amplify Console)
# Go to: Hosting → Build settings → View build logs
```

## Step 5: Update Proposal (5 minutes)

Add to **Appendix C** in your AWS proposal:

```
ZKP-Studio prototype demonstration:
- Live demo: https://wave3ai.org
- Backend API: <your-apprunner-url>
- Source code: https://github.com/wave3ai/zkp-studio
- AWS deployment: AppRunner (backend) + Amplify (frontend)
- Operational since: October 2025

Platform demonstrates policy-aware ZKP compilation, AI-assisted 
engine selection, and entropy budget validation on production 
AWS infrastructure.
```

## Troubleshooting

### Backend Issues

**Problem:** Container fails to start
```bash
# Check ECR image
aws ecr describe-images --repository-name zkp-studio-backend

# Check App Runner logs
aws logs tail /aws/apprunner/zkp-studio-backend --follow

# Test locally first
docker run -p 8000:8000 zkp-studio-backend
curl http://localhost:8000/
```

**Problem:** App Runner service not found
```bash
# List all services
aws apprunner list-services --region us-east-1

# Check service status
aws apprunner describe-service --service-arn <ARN>
```

### Frontend Issues

**Problem:** CORS errors
- Ensure backend CORS allows frontend domain
- Check backend `main.py` line 24:
  ```python
  allow_origins=["https://wave3ai.org", "https://*.amplifyapp.com"]
  ```

**Problem:** Can't connect to backend
- Verify `REACT_APP_API_URL` in Amplify environment variables
- Check browser console for exact error
- Test backend directly: `curl https://backend-url/engines`

**Problem:** Build fails on Amplify
- Check Node version (need 16+)
- Verify `package.json` has all dependencies
- Check build logs in Amplify Console

### Domain Issues

**Problem:** wave3ai.org not resolving
```bash
# Check DNS
dig wave3ai.org
nslookup wave3ai.org

# Verify Route 53 record
aws route53 list-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --query "ResourceRecordSets[?Name=='wave3ai.org.']"
```

## Cost Tracking

Monitor costs in AWS Cost Explorer:
```bash
# Get month-to-date costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "1 month ago" +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE
```

Expected costs:
- AppRunner: $10-20/month
- Amplify: $0-5/month
- Total: ~$10-25/month

## Next Steps

1. ✅ Test all functionality end-to-end
2. ✅ Take screenshots for proposal
3. ✅ Update proposal Appendix C
4. ✅ Add GitHub link to proposal
5. ✅ Submit AWS proposal by Nov 5, 2025

## Support

Questions? Contact: dlyoung@smu.edu
