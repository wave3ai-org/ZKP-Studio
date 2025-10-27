# ZKP-Studio Prototype

> **Policy-Aware Zero-Knowledge Proof Platform**  
> Research project from SMU Darwin Deason Institute for Cybersecurity

[![AWS AppRunner](https://img.shields.io/badge/AWS-AppRunner-orange)](https://aws.amazon.com/apprunner/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-blue)](https://aws.amazon.com/amplify/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

## Overview

ZKP-Studio demonstrates a novel approach to zero-knowledge proof generation through:

- **Natural Language Policy Compilation**: Convert plain English policies into verifiable proof circuits
- **AI-Assisted Engine Selection**: Automatically recommend optimal ZKP engines (Groth16, PLONK, STARK, Bulletproofs)
- **Entropy Budget Validation**: Track and measure cryptographic entropy consumption
- **Policy Agility**: Enable policy updates without verifier re-issuance

## Architecture

```
┌─────────────────────┐
│   wave3ai.org       │  ← Frontend (AWS Amplify)
│   React + Tailwind  │
└──────────┬──────────┘
           │ HTTPS
           ↓
┌─────────────────────┐
│   Backend API       │  ← Backend (AWS AppRunner)
│   FastAPI + Python  │
└─────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.11+
- Docker
- AWS CLI configured
- AWS account (Wave3 LLC existing account)

### 1. Backend Deployment

```bash
cd backend

# Build Docker image
docker build -t zkp-studio-backend .

# Test locally
docker run -p 8000:8000 zkp-studio-backend
# Visit http://localhost:8000/docs

# Deploy to AWS AppRunner (see backend/README.md)
```

### 2. Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend URL

# Test locally
npm start
# Visit http://localhost:3000

# Deploy to AWS Amplify (see frontend/README.md)
```

## Project Structure

```
zkp-studio-prototype/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Container image
│   └── README.md            # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── App.js          # React main component
│   │   ├── index.js        # Entry point
│   │   └── index.css       # Tailwind styles
│   ├── public/
│   ├── package.json        # Node dependencies
│   └── README.md           # Frontend documentation
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD automation
└── README.md               # This file
```

## AWS Deployment Architecture

### Backend: AWS AppRunner
- **Why**: Container-based, auto-scaling, pay-per-use
- **Cost**: ~$10-20/month for demo traffic
- **Endpoint**: `https://xxxxx.us-east-1.awsapprunner.com`

### Frontend: AWS Amplify
- **Why**: Git-based CI/CD, global CDN, free SSL
- **Cost**: Free tier covers demo usage
- **Domain**: `wave3ai.org` (your existing domain)

### Benefits for AWS Proposal
✅ Deployed on AWS infrastructure  
✅ Uses AWS services reviewers recognize  
✅ Demonstrates AWS ecosystem proficiency  
✅ Can leverage AWS Promotional Credits from award  

## Features Demonstrated

### 1. Policy Compilation
```
Input:  "Verify user is over 18 without revealing birthdate"
Output: R1CS circuit with 150 constraints
        Recommended engine: Groth16
        Entropy budget: 16 bytes
```

### 2. Engine Selection
AI analyzes policy complexity to recommend:
- **Groth16**: Fast verification, small proofs (trusted setup)
- **PLONK**: Universal setup, medium size
- **STARK**: Transparent, post-quantum, large proofs
- **Bulletproofs**: Range proofs, no trusted setup

### 3. Proof Generation
Generates verifiable zero-knowledge proofs with:
- Proof data (SHA256 hash representation)
- Verification key
- Entropy consumption metrics
- Generation time tracking

### 4. Verification
One-click proof verification demonstrating:
- Cryptographic validity
- Fast verification times (~2-5ms)
- Engine-specific verification

## API Endpoints

### Backend (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/engines` | GET | List ZKP engines |
| `/stats` | GET | System statistics |
| `/compile` | POST | Compile policy → circuit |
| `/prove` | POST | Generate ZK proof |
| `/verify/{proof_id}` | POST | Verify proof |
| `/circuits/{id}` | GET | Get circuit details |
| `/proofs/{id}` | GET | Get proof details |

Interactive docs: `https://your-backend-url/docs`

## Research Context

This prototype implements concepts from three SMU-DDI working papers:

1. **WP-ZKP-2025-A**: Entropy-Budget Validation for ZKP Systems
2. **WP-ZKP-2025-B**: AI-Guided Selection of ZKP Engines
3. **WP-ZKP-2025-C**: Policy-Aware Proof Compilation and Dynamic Agility

## AWS Proposal Integration

### How to Reference in Proposal

**Appendix C Addition:**
```
ZKP-Studio prototype deployed on AWS infrastructure:
- Backend API: AWS AppRunner (container-based microservice)
- Frontend: AWS Amplify Hosting (CDN, CI/CD)
- Domain: wave3ai.org (Route 53)
- Source code: github.com/wave3ai/zkp-studio

Live demo available for reviewer evaluation.
```

**Main Proposal:**
```
Our team has operational AWS deployment experience, evidenced by 
ZKP-Studio prototype running on AppRunner and Amplify. This 
demonstrates readiness to leverage AWS Promotional Credits for 
confidential computing experimentation with Nitro Enclaves and 
NVIDIA H100 instances.
```

## Costs

### Development/Demo Phase
- **Backend (AppRunner)**: $10-20/month
- **Frontend (Amplify)**: $0-5/month (free tier)
- **Domain (Route 53)**: $0.50/month (already owned)
- **Total**: ~$10-25/month

### With AWS Award Credits
- Use $40K AWS credits for:
  - Hosting (free)
  - Research compute (Nitro Enclaves, H100 instances)
  - DynamoDB, S3, CloudWatch
  - CloudHSM for production crypto

## Deployment Timeline

### Week 1: Backend
- Day 1-2: Build and test locally
- Day 3-4: Push to ECR and deploy to AppRunner
- Day 5: Configure domain and test API

### Week 2: Frontend  
- Day 1-2: Build React app locally
- Day 3-4: Deploy to Amplify, configure wave3ai.org
- Day 5: End-to-end testing

### Before AWS Proposal Deadline (Nov 5)
- ✅ Live demo at wave3ai.org
- ✅ GitHub repository public
- ✅ Documentation complete
- ✅ Include in proposal Appendix C

## Scaling to Production

Current implementation uses in-memory storage (demo only).

For production, add:
1. **DynamoDB** for circuit/proof persistence
2. **AWS Secrets Manager** for API keys
3. **Amazon QLDB** for audit trail
4. **AWS CloudHSM** for hardware security
5. **AWS Nitro Enclaves** for confidential computing
6. **API Gateway** for rate limiting and auth
7. **CloudWatch** for monitoring

## Security Notes

⚠️ **This is a research prototype**. For production:
- Implement real ZKP engines (not mocked)
- Add authentication and authorization
- Use hardware entropy sources (AWS CloudHSM)
- Enable request validation and rate limiting
- Implement proper key management
- Add comprehensive logging and monitoring

## Contributing

This is a research project from SMU Darwin Deason Institute. For collaboration inquiries:

**Principal Investigator:**  
Dr. Darrell L. Young, P.E.  
Research Professor, SMU-DDI  
Email: dlyoung@smu.edu  

## License

This research prototype is part of SMU's AWS Science Research Awards proposal.

Copyright © 2025 Southern Methodist University  
Darwin Deason Institute for Cybersecurity

## Acknowledgments

Research supported by:
- Southern Methodist University
- Darwin Deason Institute for Cybersecurity
- AWS Science Research Awards Program (proposed)

---

**Status**: Development Prototype  
**Last Updated**: October 2025  
**Deployment Target**: wave3ai.org  
**AWS Account**: Wave3 LLC (10+ years established)
