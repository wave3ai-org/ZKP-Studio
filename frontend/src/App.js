import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('compile');
  const [policyText, setPolicyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [compiledCircuit, setCompiledCircuit] = useState(null);
  const [proof, setProof] = useState(null);
  const [engines, setEngines] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Fetch engines on mount
  React.useEffect(() => {
    fetchEngines();
    fetchStats();
  }, []);

  const fetchEngines = async () => {
    try {
      const response = await fetch(`${API_URL}/engines`);
      const data = await response.json();
      setEngines(data.engines);
    } catch (err) {
      console.error('Failed to fetch engines:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCompile = async () => {
    if (!policyText.trim()) {
      setError('Please enter a policy statement');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy_text: policyText,
          domain: 'general'
        }),
      });

      if (!response.ok) {
        throw new Error('Compilation failed');
      }

      const data = await response.json();
      setCompiledCircuit(data);
      setActiveTab('circuit');
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!compiledCircuit) {
      setError('Please compile a policy first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/prove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          circuit_id: compiledCircuit.circuit_id,
          witness_data: {
            sample_data: 'demo_witness',
            timestamp: Date.now()
          },
          engine: 'auto'
        }),
      });

      if (!response.ok) {
        throw new Error('Proof generation failed');
      }

      const data = await response.json();
      setProof(data);
      setActiveTab('proof');
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof) {
      setError('No proof to verify');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/verify/${proof.proof_id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      alert(`Proof Verified!\n\nValid: ${data.valid}\nVerification Time: ${data.verification_time_ms}ms\nEngine: ${data.engine}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const examplePolicies = [
    "Verify user is over 18 without revealing birthdate",
    "Prove confidential AI model inference without exposing model parameters",
    "Demonstrate supply chain compliance without revealing supplier identities",
    "Verify audit trail integrity without disclosing transaction details"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ZKP-Studio</h1>
              <p className="text-sm text-gray-600 mt-1">
                Policy-Aware Zero-Knowledge Proof Platform
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">SMU Darwin Deason Institute</p>
              <p className="text-xs text-gray-500">for Cybersecurity</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.circuits_compiled}</div>
              <div className="text-sm text-gray-600">Circuits Compiled</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.proofs_generated}</div>
              <div className="text-sm text-gray-600">Proofs Generated</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.engines_available}</div>
              <div className="text-sm text-gray-600">ZKP Engines</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Input Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Enter Policy Statement
              </h2>
              
              {/* Example Policies */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Example Policies:
                </label>
                <div className="space-y-2">
                  {examplePolicies.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPolicyText(example)}
                      className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Enter your natural language policy here..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <button
                onClick={handleCompile}
                disabled={loading || !policyText.trim()}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Compiling...' : 'Compile Policy to Circuit'}
              </button>
            </div>

            {/* Compiled Circuit Display */}
            {compiledCircuit && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  2. Compiled Circuit
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Circuit ID</div>
                    <div className="text-sm font-mono">{compiledCircuit.circuit_id}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Recommended Engine</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {compiledCircuit.recommended_engine.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Constraints</div>
                    <div className="text-sm font-semibold">{compiledCircuit.constraints}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Entropy Budget</div>
                    <div className="text-sm font-semibold">{compiledCircuit.entropy_budget.toFixed(2)} bytes</div>
                  </div>
                </div>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-4">
                  <pre className="whitespace-pre-wrap">{compiledCircuit.compiled_circuit}</pre>
                </div>

                <button
                  onClick={handleGenerateProof}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Zero-Knowledge Proof'}
                </button>
              </div>
            )}

            {/* Proof Display */}
            {proof && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  3. Generated Proof
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Proof ID</div>
                    <div className="text-sm font-mono">{proof.proof_id}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Engine Used</div>
                    <div className="text-sm font-semibold text-green-600">
                      {proof.engine_used.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Generation Time</div>
                    <div className="text-sm font-semibold">{proof.generation_time_ms.toFixed(2)} ms</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-gray-600">Entropy Consumed</div>
                    <div className="text-sm font-semibold">{proof.entropy_consumed.toFixed(2)} bytes</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Proof Data (SHA256)
                    </label>
                    <div className="bg-gray-900 text-blue-400 p-3 rounded font-mono text-xs break-all">
                      {proof.proof_data}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Verification Key
                    </label>
                    <div className="bg-gray-900 text-purple-400 p-3 rounded font-mono text-xs break-all">
                      {proof.verification_key}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Status: {proof.status.toUpperCase()}</span>
                </div>

                <button
                  onClick={handleVerifyProof}
                  disabled={loading}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify Proof'}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* About Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                About ZKP-Studio
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ZKP-Studio is a research platform for policy-aware zero-knowledge proof generation, 
                developed at SMU's Darwin Deason Institute for Cybersecurity.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>AI-assisted ZKP engine selection</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Natural language policy compilation</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Entropy budget validation</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Policy agility with verifier continuity</span>
                </div>
              </div>
            </div>

            {/* ZKP Engines Card */}
            {engines && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Available ZKP Engines
                </h3>
                <div className="space-y-3">
                  {Object.entries(engines).map(([key, engine]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-semibold text-gray-800">{engine.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Proof Size: {engine.proof_size}</div>
                        <div>Verification: {engine.verification_time}</div>
                        <div className="mt-1 text-blue-600">{engine.best_for}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">How It Works</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-2 flex-shrink-0">1</span>
                  <span>Enter a natural language policy statement</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-2 flex-shrink-0">2</span>
                  <span>AI analyzes complexity and selects optimal ZKP engine</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-2 flex-shrink-0">3</span>
                  <span>Policy compiles to verifiable proof circuit</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-2 flex-shrink-0">4</span>
                  <span>Generate and verify zero-knowledge proofs</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2025 Southern Methodist University - Darwin Deason Institute for Cybersecurity</p>
            <p className="mt-1">Research supported by AWS Science Research Awards Program</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
