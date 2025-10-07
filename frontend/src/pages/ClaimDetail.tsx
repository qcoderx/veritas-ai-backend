import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAppSelector } from '../redux/store';

const ClaimDetail = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [claimData, setClaimData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableClaims, setAvailableClaims] = useState<any[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');

  useEffect(() => {
    const fetchClaimData = async () => {
      if (!claimId || !token) return;
      
      try {
        const data = await apiService.getClaimById(claimId, token);
        setClaimData(data);
      } catch (error: any) {
        console.error('Failed to fetch claim:', error);
        if (error.message?.includes('not found') || error.message?.includes('permission')) {
          setError('Claim not found or you do not have permission to access it.');
        } else {
          setError('Failed to load claim details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClaimData();
  }, [claimId, token]);

  useEffect(() => {
    const fetchAllClaims = async () => {
      if (!token) return;
      
      try {
        const claims = await apiService.getClaims(token);
        setAvailableClaims(Array.isArray(claims) ? claims : []);
        if (claimId) setSelectedClaimId(claimId);
      } catch (error) {
        console.error('Failed to fetch claims for selector:', error);
      }
    };

    fetchAllClaims();
  }, [token, claimId]);

  const runAnalysis = async () => {
    if (!claimId || !token) return;
    
    try {
      await apiService.triggerAnalysis(claimId, token);
      // Refresh claim data to get updated status
      const updatedData = await apiService.getClaimById(claimId, token);
      setClaimData(updatedData);
    } catch (error) {
      console.error('Failed to trigger analysis:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !token || isTyping || !selectedClaimId) return;
    
    console.log('Sending message with token:', token ? 'Present' : 'Missing');
    console.log('Selected Claim ID:', selectedClaimId);
    
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatInput('');
    setIsTyping(true);
    
    try {
      const queryClaimId = selectedClaimId || claimId || '';
      if (!queryClaimId) {
        setChatMessages(prev => [...prev, { type: 'ai', message: 'Please select a claim to investigate.' }]);
        return;
      }
      const response = await apiService.investigate(queryClaimId, userMessage, token);
      setChatMessages(prev => [...prev, { type: 'ai', message: response.answer || 'Analysis complete.' }]);
    } catch (error: any) {
      console.error('Investigation error:', error);
      let errorMessage = 'Sorry, I encountered an error processing your request.';
      
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.message?.includes('not found') || error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to investigate this claim.';
      }
      
      setChatMessages(prev => [...prev, { type: 'ai', message: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error || !claimData) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-white text-xl mb-2">Access Denied</p>
          <p className="text-slate-400">{error || 'The requested claim could not be loaded.'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/claims')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-slate-400"></i>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Claim Details</h1>
            <p className="text-slate-400">Claim ID: {claimData.id}</p>
          </div>
        </div>
        {claimData.status === 'upload_in_progress' && (
          <button
            onClick={runAnalysis}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
          >
            <i className="fa-solid fa-play mr-2"></i>
            Run AI Analysis
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Info */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Claim Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className="text-white capitalize">{claimData.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Adjuster ID</p>
                <p className="text-white font-mono">{claimData.adjuster_id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Created</p>
                <p className="text-white">{new Date(claimData.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Updated</p>
                <p className="text-white">{new Date(claimData.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {claimData.additional_info && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
              <p className="text-slate-300">{claimData.additional_info}</p>
            </div>
          )}

          {/* Summary */}
          {claimData.summary && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Analysis Summary</h2>
              <p className="text-slate-300">{claimData.summary}</p>
            </div>
          )}

          {/* AI Analysis Results */}
          {claimData.fraud_risk_score !== null && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">AI Analysis Results</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-500 mb-1">{claimData.fraud_risk_score}%</div>
                    <div className="w-20 h-2 bg-slate-700 rounded-full">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${claimData.fraud_risk_score}%` }}
                      ></div>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">Fraud Risk</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Key Risk Factors</h3>
                    {claimData.key_risk_factors && claimData.key_risk_factors.length > 0 ? (
                      <ul className="space-y-1">
                        {claimData.key_risk_factors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-red-400">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400">No specific risk factors identified.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  claimData.status === 'analyzed' ? 'text-green-400 bg-green-400 bg-opacity-10' : 'text-yellow-400 bg-yellow-400 bg-opacity-10'
                }`}>
                  {claimData.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Risk Score</span>
                <span className="text-white">{claimData.fraud_risk_score !== null ? `${claimData.fraud_risk_score}%` : 'Pending'}</span>
              </div>
            </div>
          </div>

          {/* Co-Pilot Chat */}
          {claimData.fraud_risk_score !== null && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                <i className="fa-solid fa-comments text-emerald-500 mr-2"></i>
                AI Co-Pilot
              </h3>
              
              {/* Claim Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Claim to Query</label>
                <select 
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Choose a claim...</option>
                  {availableClaims.map((claim) => (
                    <option key={claim.id} value={claim.id}>
                      {claim.id} - {claim.status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-4">
                <div className="h-40 overflow-y-auto space-y-2 bg-slate-900 p-3 rounded-lg">
                  {chatMessages.length === 0 ? (
                    <p className="text-slate-400 text-sm">Ask me anything about this claim...</p>
                  ) : (
                    <>
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-2 rounded-lg text-sm ${
                            msg.type === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-2 justify-start">
                          <div className="bg-slate-700 text-slate-200 p-2 rounded-lg text-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={selectedClaimId ? "Ask about the selected claim..." : "Select a claim first..."}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isTyping || !chatInput.trim() || !selectedClaimId}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    {isTyping ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fa-solid fa-paper-plane"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;