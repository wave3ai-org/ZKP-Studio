"""
ZKP-Studio Prototype Backend
FastAPI application for AWS AppRunner deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import hashlib
import time
from datetime import datetime

app = FastAPI(
    title="ZKP-Studio API",
    description="Policy-aware Zero-Knowledge Proof generation platform",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class PolicyRequest(BaseModel):
    policy_text: str
    domain: Optional[str] = "general"
    
class ProofRequest(BaseModel):
    circuit_id: str
    witness_data: Dict[str, Any]
    engine: Optional[str] = "auto"

class CircuitResponse(BaseModel):
    circuit_id: str
    policy_text: str
    compiled_circuit: str
    recommended_engine: str
    entropy_budget: float
    constraints: int
    timestamp: str

class ProofResponse(BaseModel):
    proof_id: str
    circuit_id: str
    engine_used: str
    proof_data: str
    verification_key: str
    entropy_consumed: float
    generation_time_ms: float
    status: str

# In-memory storage (replace with DynamoDB in production)
circuits_db = {}
proofs_db = {}

# Mock ZKP Engines Configuration
ZKP_ENGINES = {
    "groth16": {
        "name": "Groth16",
        "proof_size": "128 bytes",
        "verification_time": "~2ms",
        "setup": "Trusted setup required",
        "best_for": "Small circuits, fast verification"
    },
    "plonk": {
        "name": "PLONK",
        "proof_size": "384 bytes",
        "verification_time": "~5ms",
        "setup": "Universal trusted setup",
        "best_for": "Medium circuits, updateable"
    },
    "stark": {
        "name": "STARK",
        "proof_size": "~100KB",
        "verification_time": "~50ms",
        "setup": "Transparent (no trusted setup)",
        "best_for": "Large circuits, post-quantum"
    },
    "bulletproofs": {
        "name": "Bulletproofs",
        "proof_size": "~1.3KB",
        "verification_time": "~100ms",
        "setup": "No trusted setup",
        "best_for": "Range proofs, confidential transactions"
    }
}

def analyze_policy_complexity(policy_text: str) -> Dict[str, Any]:
    """Analyze policy to determine circuit complexity and entropy requirements"""
    word_count = len(policy_text.split())
    
    # Mock complexity analysis
    if "age" in policy_text.lower() and "verify" in policy_text.lower():
        return {
            "constraints": 150,
            "entropy_required": 128,
            "circuit_type": "comparison",
            "recommended_engine": "groth16"
        }
    elif "confidential" in policy_text.lower() or "private" in policy_text.lower():
        return {
            "constraints": 500,
            "entropy_required": 256,
            "circuit_type": "encryption",
            "recommended_engine": "plonk"
        }
    elif "audit" in policy_text.lower() or "compliance" in policy_text.lower():
        return {
            "constraints": 1000,
            "entropy_required": 256,
            "circuit_type": "audit_trail",
            "recommended_engine": "stark"
        }
    else:
        return {
            "constraints": 300,
            "entropy_required": 192,
            "circuit_type": "general",
            "recommended_engine": "plonk"
        }

def compile_policy_to_circuit(policy_text: str, analysis: Dict[str, Any]) -> str:
    """Mock policy compilation to R1CS circuit representation"""
    circuit_type = analysis["circuit_type"]
    constraints = analysis["constraints"]
    
    # Generate mock circuit representation
    circuit = f"""
// ZKP-Studio Generated Circuit
// Policy: {policy_text[:50]}...
// Type: {circuit_type}
// Constraints: {constraints}

circuit PolicyCircuit {{
    // Public inputs
    signal input policy_hash;
    signal input timestamp;
    
    // Private witness
    signal private input witness_data;
    signal private input entropy_source;
    
    // Constraints
    """
    
    for i in range(min(5, constraints // 100)):
        circuit += f"\n    constraint_{i} <== witness_data * entropy_source + {i};"
    
    circuit += f"""
    
    // Output
    signal output proof_valid;
    proof_valid <== 1;
}}

// Entropy Budget: {analysis['entropy_required']} bits
// Recommended Engine: {analysis['recommended_engine']}
"""
    return circuit

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "ZKP-Studio API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/engines")
async def list_engines():
    """List available ZKP engines and their characteristics"""
    return {
        "engines": ZKP_ENGINES,
        "total": len(ZKP_ENGINES)
    }

@app.post("/compile", response_model=CircuitResponse)
async def compile_policy(request: PolicyRequest):
    """
    Compile natural language policy to ZKP circuit
    
    This endpoint demonstrates:
    1. Policy parsing and analysis
    2. Circuit complexity estimation
    3. AI-assisted engine selection
    4. Entropy budget calculation
    """
    try:
        # Analyze policy complexity
        analysis = analyze_policy_complexity(request.policy_text)
        
        # Compile to circuit
        circuit_code = compile_policy_to_circuit(request.policy_text, analysis)
        
        # Generate circuit ID
        circuit_id = hashlib.sha256(
            f"{request.policy_text}{time.time()}".encode()
        ).hexdigest()[:16]
        
        # Create response
        response = CircuitResponse(
            circuit_id=circuit_id,
            policy_text=request.policy_text,
            compiled_circuit=circuit_code,
            recommended_engine=analysis["recommended_engine"],
            entropy_budget=analysis["entropy_required"] / 8,  # Convert bits to bytes
            constraints=analysis["constraints"],
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Store in database
        circuits_db[circuit_id] = response.dict()
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compilation error: {str(e)}")

@app.post("/prove", response_model=ProofResponse)
async def generate_proof(request: ProofRequest):
    """
    Generate zero-knowledge proof for compiled circuit
    
    Demonstrates:
    1. Witness data handling
    2. Engine-specific proof generation
    3. Entropy consumption tracking
    4. Proof verification key generation
    """
    try:
        # Check if circuit exists
        if request.circuit_id not in circuits_db:
            raise HTTPException(status_code=404, detail="Circuit not found")
        
        circuit = circuits_db[request.circuit_id]
        
        # Select engine
        engine = request.engine if request.engine != "auto" else circuit["recommended_engine"]
        
        if engine not in ZKP_ENGINES:
            raise HTTPException(status_code=400, detail=f"Unknown engine: {engine}")
        
        # Simulate proof generation
        start_time = time.time()
        
        # Mock proof generation
        proof_data = hashlib.sha256(
            json.dumps({
                "circuit": request.circuit_id,
                "witness": request.witness_data,
                "engine": engine,
                "timestamp": time.time()
            }).encode()
        ).hexdigest()
        
        verification_key = hashlib.sha256(
            f"{request.circuit_id}{engine}vk".encode()
        ).hexdigest()
        
        generation_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Calculate entropy consumed (mock)
        entropy_consumed = circuit["entropy_budget"] * 0.95  # 95% of budget
        
        # Generate proof ID
        proof_id = hashlib.sha256(
            f"{proof_data}{time.time()}".encode()
        ).hexdigest()[:16]
        
        # Create response
        response = ProofResponse(
            proof_id=proof_id,
            circuit_id=request.circuit_id,
            engine_used=engine,
            proof_data=proof_data,
            verification_key=verification_key,
            entropy_consumed=entropy_consumed,
            generation_time_ms=generation_time,
            status="valid"
        )
        
        # Store proof
        proofs_db[proof_id] = response.dict()
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof generation error: {str(e)}")

@app.post("/verify/{proof_id}")
async def verify_proof(proof_id: str):
    """Verify a generated proof"""
    if proof_id not in proofs_db:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    proof = proofs_db[proof_id]
    
    # Mock verification (always succeeds in demo)
    verification_time = 2.5  # ms
    
    return {
        "proof_id": proof_id,
        "valid": True,
        "verification_time_ms": verification_time,
        "engine": proof["engine_used"],
        "verified_at": datetime.utcnow().isoformat()
    }

@app.get("/circuits/{circuit_id}")
async def get_circuit(circuit_id: str):
    """Retrieve circuit details"""
    if circuit_id not in circuits_db:
        raise HTTPException(status_code=404, detail="Circuit not found")
    
    return circuits_db[circuit_id]

@app.get("/proofs/{proof_id}")
async def get_proof(proof_id: str):
    """Retrieve proof details"""
    if proof_id not in proofs_db:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    return proofs_db[proof_id]

@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    return {
        "circuits_compiled": len(circuits_db),
        "proofs_generated": len(proofs_db),
        "engines_available": len(ZKP_ENGINES),
        "uptime_status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)