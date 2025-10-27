# ZKP-Studio Frontend

React-based frontend for ZKP-Studio, designed for AWS Amplify deployment.

## Features

- Interactive policy compilation interface
- Real-time ZKP engine recommendations
- Proof generation and verification
- Entropy budget visualization
- Mobile-responsive design with Tailwind CSS

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env to point to your backend
# REACT_APP_API_URL=http://localhost:8000

# Start development server
npm start

# App available at http://localhost:3000
```

## Deploy to AWS Amplify

### Option 1: AWS Amplify Console (Recommended)

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial ZKP-Studio frontend"
git branch -M main
git remote add origin https://github.com/wave3ai/zkp-studio-frontend.git
git push -u origin main
```

2. **Connect to Amplify:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the repository and branch
   - Amplify auto-detects React settings

3. **Configure build settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. **Add environment variables:**
   - In Amplify Console → App settings → Environment variables
   - Add: `REACT_APP_API_URL` = `https://your-backend.awsapprunner.com`

5. **Custom domain (wave3ai.org):**
   - App settings → Domain management
   - Add domain: wave3ai.org
   - Follow DNS configuration steps
   - Amplify provides SSL certificate automatically

### Option 2: AWS Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify (first time)
amplify configure

# Initialize Amplify in project
amplify init
# Choose:
# - Name: zkpstudio
# - Environment: prod
# - Editor: your choice
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Distribution directory: build
# - Build command: npm run build
# - Start command: npm start

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console (Managed hosting with custom domains, CI/CD)

# Publish
amplify publish
```

### Option 3: Manual S3 + CloudFront

```bash
# Build production bundle
npm run build

# Sync to S3
aws s3 sync build/ s3://wave3ai.org --delete

# Invalidate CloudFront cache (if using CDN)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://xxx.awsapprunner.com` |

### Backend Connection

The frontend expects these backend endpoints:
- `GET /engines` - List available ZKP engines
- `GET /stats` - System statistics
- `POST /compile` - Compile policy to circuit
- `POST /prove` - Generate proof
- `POST /verify/{proof_id}` - Verify proof

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js              # Main application component
│   ├── index.js            # React entry point
│   └── index.css           # Global styles with Tailwind
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
└── postcss.config.js       # PostCSS configuration
```

## Customization

### Styling
Edit `src/index.css` and Tailwind classes in `src/App.js`

### API Endpoints
Modify `API_URL` configuration in `src/App.js`

### Example Policies
Edit the `examplePolicies` array in `src/App.js`

## Production Optimizations

For production deployment, consider:

1. **Enable compression** in Amplify/S3
2. **Configure caching headers** for static assets
3. **Set up CloudFront** for global CDN
4. **Enable HTTPS** (automatic with Amplify)
5. **Add error pages** for 404/500 errors

## Costs

AWS Amplify hosting costs:
- **Free tier**: 1,000 build minutes/month, 15 GB served/month
- **After free tier**: $0.01/build minute, $0.15/GB served
- **Custom domain**: Free SSL certificate included
- **Expected**: $0-10/month for demo traffic

## Connecting to wave3ai.org

If your domain is already in AWS Route 53:

```bash
# Get Amplify app domain
aws amplify get-app --app-id YOUR_APP_ID

# Update Route 53 record
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "wave3ai.org",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "YOUR_AMPLIFY_DOMAIN",
          "HostedZoneId": "AMPLIFY_ZONE_ID",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

## Troubleshooting

### CORS Errors
Ensure backend has CORS enabled for your frontend domain:
```python
# In backend main.py
allow_origins=["https://wave3ai.org", "http://localhost:3000"]
```

### Build Fails
Check Node version (requires Node 16+):
```bash
node --version
# If needed: nvm install 18 && nvm use 18
```

### API Connection
Verify `REACT_APP_API_URL` in Amplify environment variables

## Support

Part of SMU Darwin Deason Institute for Cybersecurity research.
For issues, contact: dlyoung@smu.edu
