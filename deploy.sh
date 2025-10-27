#!/bin/bash

# ZKP-Studio AWS Deployment Script
# This script deploys both backend and frontend to AWS

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          ZKP-Studio AWS Deployment Script                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REPO_NAME="zkp-studio-backend"
APP_RUNNER_SERVICE="zkp-studio-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install: https://aws.amazon.com/cli/${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install: https://docker.com${NC}"
        exit 1
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo -e "${YELLOW}⚠️  AWS_ACCOUNT_ID not set. Attempting to detect...${NC}"
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo -e "${GREEN}✅ Detected AWS Account ID: $AWS_ACCOUNT_ID${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo ""
}

# Deploy backend
deploy_backend() {
    echo "═══════════════════════════════════════════════════════════"
    echo "  BACKEND DEPLOYMENT (AWS AppRunner)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    cd backend
    
    # Create ECR repository if it doesn't exist
    echo "Creating ECR repository (if needed)..."
    aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION 2>/dev/null || \
        aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION
    
    # Login to ECR
    echo "Logging in to Amazon ECR..."
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build Docker image
    echo "Building Docker image..."
    docker build -t $ECR_REPO_NAME:latest .
    
    # Tag and push
    echo "Pushing image to ECR..."
    docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
    
    echo -e "${GREEN}✅ Backend image pushed to ECR${NC}"
    
    # Check if App Runner service exists
    echo "Checking App Runner service..."
    if aws apprunner list-services --region $AWS_REGION | grep -q $APP_RUNNER_SERVICE; then
        echo "Updating existing App Runner service..."
        SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceArn" --output text)
        aws apprunner update-service \
            --service-arn $SERVICE_ARN \
            --source-configuration "ImageRepository={ImageIdentifier=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest,ImageRepositoryType=ECR,ImageConfiguration={Port=8000}}" \
            --region $AWS_REGION
    else
        echo "Creating new App Runner service..."
        echo -e "${YELLOW}Please create the App Runner service manually via console or run:${NC}"
        echo ""
        echo "aws apprunner create-service \\"
        echo "  --service-name $APP_RUNNER_SERVICE \\"
        echo "  --source-configuration '{\"ImageRepository\":{\"ImageIdentifier\":\"$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest\",\"ImageRepositoryType\":\"ECR\",\"ImageConfiguration\":{\"Port\":\"8000\"}}}' \\"
        echo "  --instance-configuration '{\"Cpu\":\"1 vCPU\",\"Memory\":\"2 GB\"}' \\"
        echo "  --region $AWS_REGION"
        echo ""
    fi
    
    cd ..
    echo -e "${GREEN}✅ Backend deployment complete${NC}"
    echo ""
}

# Deploy frontend
deploy_frontend() {
    echo "═══════════════════════════════════════════════════════════"
    echo "  FRONTEND DEPLOYMENT (AWS Amplify)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    cd frontend
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Please create it:${NC}"
        echo "cp .env.example .env"
        echo "# Then edit .env with your backend URL"
        cd ..
        return
    fi
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building frontend..."
    npm run build
    
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    echo ""
    echo -e "${YELLOW}Next steps for Amplify deployment:${NC}"
    echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
    echo "2. Click 'New app' → 'Host web app'"
    echo "3. Connect your GitHub repository"
    echo "4. Amplify will auto-detect React settings"
    echo "5. Add environment variable: REACT_APP_API_URL=<your-backend-url>"
    echo "6. Configure custom domain: wave3ai.org"
    echo ""
    echo "OR use Amplify CLI:"
    echo "  npm install -g @aws-amplify/cli"
    echo "  amplify init"
    echo "  amplify add hosting"
    echo "  amplify publish"
    echo ""
    
    cd ..
}

# Main execution
main() {
    check_prerequisites
    
    echo "What would you like to deploy?"
    echo "1) Backend only (AppRunner)"
    echo "2) Frontend only (Amplify)"
    echo "3) Both (Full deployment)"
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${GREEN}  🎉 DEPLOYMENT COMPLETE!${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "1. Get your backend URL from App Runner console"
    echo "2. Update frontend .env with backend URL"
    echo "3. Complete Amplify setup for frontend"
    echo "4. Configure wave3ai.org domain in Amplify"
    echo ""
    echo "API Documentation: <backend-url>/docs"
    echo "Frontend: https://wave3ai.org"
}

# Run main function
main
