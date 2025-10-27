# ZKP-Studio Backend API

FastAPI-based backend for ZKP-Studio prototype, designed for AWS AppRunner deployment.

## Features

- **Policy Compilation**: Natural language policy → ZKP circuits
- **AI-Assisted Engine Selection**: Automatic ZKP engine recommendation
- **Proof Generation**: Generate zero-knowledge proofs
- **Entropy Tracking**: Monitor entropy budget consumption
- **Multi-Engine Support**: Groth16, PLONK, STARK, Bulletproofs

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python main.py

# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

## Deploy to AWS AppRunner

### Option 1: AWS Console (Easiest)

1. **Build and push Docker image to ECR:**
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository (first time only)
aws ecr create-repository --repository-name zkp-studio-backend --region us-east-1

# Build image
docker build -t zkp-studio-backend .

# Tag image
docker tag zkp-studio-backend:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest

# Push to ECR
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest
```

2. **Create App Runner service:**
   - Go to AWS AppRunner console
   - Click "Create service"
   - Source: Container registry → Amazon ECR
   - Select your image
   - Deployment: Manual or Automatic
   - Configure service:
     - CPU: 1 vCPU
     - Memory: 2 GB
     - Port: 8000
   - Health check path: `/`
   - Environment variables: (none required for demo)
   - Create service

### Option 2: AWS CLI

```bash
# Create service
aws apprunner create-service \
  --service-name zkp-studio-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/zkp-studio-backend:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8000"
      }
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \
  --region us-east-1
```

### Option 3: GitHub Actions (Continuous Deployment)

See `.github/workflows/deploy.yml` in root directory.

## API Endpoints

### Health & Info
- `GET /` - Health check
- `GET /engines` - List available ZKP engines
- `GET /stats` - System statistics

### Core Functionality
- `POST /compile` - Compile policy to circuit
  ```json
  {
    "policy_text": "Verify user is over 18 without revealing birthdate",
    "domain": "age_verification"
  }
  ```

- `POST /prove` - Generate proof
  ```json
  {
    "circuit_id": "abc123",
    "witness_data": {"age": 25, "birthdate": "1999-01-01"},
    "engine": "auto"
  }
  ```

- `POST /verify/{proof_id}` - Verify proof

### Query
- `GET /circuits/{circuit_id}` - Get circuit details
- `GET /proofs/{proof_id}` - Get proof details

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 |
| `LOG_LEVEL` | Logging level | info |

## Costs

Estimated AWS AppRunner costs for demo traffic:
- **Active time**: $0.064/GB-hour (memory) + $0.007/vCPU-hour
- **Idle time**: ~$6.48/month for 1 provisioned container
- **Expected**: $10-20/month for demo usage

## Upgrading to Production

For production deployment, consider:
1. Add DynamoDB for persistent storage (replace in-memory dicts)
2. Add AWS Secrets Manager for API keys
3. Enable auto-scaling (already supported by AppRunner)
4. Add CloudWatch logging and metrics
5. Implement rate limiting
6. Add authentication (AWS Cognito or API Gateway)

## API Documentation

Once deployed, visit:
- Interactive docs: `https://your-service-url.awsapprunner.com/docs`
- OpenAPI spec: `https://your-service-url.awsapprunner.com/openapi.json`

## Support

Part of SMU Darwin Deason Institute for Cybersecurity research.
For issues, contact: dlyoung@smu.edu
