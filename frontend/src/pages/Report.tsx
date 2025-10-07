// src/pages/Report.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAppSelector } from '../redux/store';
import { IoArrowBack, IoFlash, IoClipboard, IoWarning, IoCheckmarkCircle } from 'react-icons/io5';

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  // Read state from the analytics slice
  const reportContent = useAppSelector(state => state.analytics.claimReportContent);
  const isLoading = useAppSelector(state => state.analytics.isLoading);

  // --- MOCK/FALLBACK DATA (Uses structured JSON for clear display) ---
  // In a real application, this data would come from a successful API call 
  // that dispatches the 'fetchReportSuccess' action.
  const mockReportJson = 
    `{
    "claim_id": "CLM-4892",
    "fraud_risk_score": "92%",
    "risk_level": "High Risk",
    "key_findings": [
        "Photo timestamp (2025-01-10 09:15) predates police report filing (2025-01-10 20:00).",
        "Reverse image search flagged vehicle on a salvage auction site dated 2024-11-01.",
        "EXIF data for two images is missing, suggesting digital manipulation or non-original source."
    ],
    "recommendation": "Require third-party forensic review and immediate escalation to the fraud unit.",
    "status": "Escalation Required"
    }`;
    
  const successReportJson = 
    `{
    "claim_id": "CLM-5012",
    "fraud_risk_score": "5%",
    "risk_level": "Low Risk",
    "key_findings": [
        "All submitted metadata is consistent with the reported time and location.",
        "Vehicle VIN matches registration details; no prior salvage history detected.",
        "Repair quote falls within the expected range for the reported damage."
    ],
    "recommendation": "Approve claim for processing without further manual review.",
    "status": "Approved for Payout"
    }`;
    
  // Determine which data to use based on the content available in Redux
  const finalReportContent = reportContent || (Math.random() > 0.5 ? mockReportJson : successReportJson);
  const reportData = JSON.parse(finalReportContent);

  // Dynamic styling based on risk level
  const isHighRisk = reportData.risk_level.includes('High');
  const riskColorClass = isHighRisk ? 'bg-red-600' : 'bg-emerald-600';
  const RiskIcon = isHighRisk ? IoWarning : IoCheckmarkCircle;


  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center bg-gray-100 min-h-[50vh]">
        <div className="text-center text-indigo-600 font-semibold text-xl">
          <IoFlash className="inline-block animate-pulse h-6 w-6 mr-2" /> AI is synthesizing the final verdict...
        </div>
      </div>
    );
  }
  
  return (
    // Content is ready to be wrapped by the DashboardLayout (when implemented)
    <div className="p-8 max-w-6xl mx-auto font-sans">
      
      {/* Header and Action Bar */}
      <div className="mb-8 flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <IoClipboard className="h-8 w-8 mr-3 text-indigo-700" /> 
            AI Investigation for Claim <span className="text-indigo-600 ml-2">#{reportData.claim_id}</span>
        </h1>
        <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-600 flex items-center hover:text-indigo-600 transition p-2 rounded-lg bg-white shadow-sm hover:shadow-md"
        >
            <IoArrowBack className="h-4 w-4 mr-1" /> Back to Login
        </button>
      </div>

      {/* Score and Summary Card - High visual priority */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 mb-8">
          <div className={`p-6 text-white flex justify-between items-center ${riskColorClass}`}>
              <div className='flex items-center'>
                  <RiskIcon className="h-8 w-8 mr-4" />
                  <div>
                    <p className="text-lg font-medium opacity-80">Final AI Status</p>
                    <h2 className="text-3xl font-bold">{reportData.status}</h2>
                  </div>
              </div>
              
              <div className='text-right'>
                <p className='text-lg font-medium opacity-80'>Fraud Risk Score</p>
                <span className="text-5xl font-extrabold tracking-tight">{reportData.fraud_risk_score}</span>
              </div>
          </div>

          <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                <IoWarning className={`h-5 w-5 mr-2 ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`} /> Key Findings Summary
              </h3>
              
              <ul className="space-y-3">
                  {reportData.key_findings.map((finding: string, index: number) => (
                      <li key={index} className="flex items-start text-gray-700">
                          <span className={`font-bold mr-2 text-xl ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`}>•</span>
                          {finding}
                      </li>
                  ))}
              </ul>
              
              {/* AI Recommendation Box */}
              <div className={`mt-6 p-4 border-l-4 rounded-lg shadow-inner ${isHighRisk ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'}`}>
                  <h4 className="font-bold text-lg text-gray-800">AI Final Recommendation:</h4>
                  <p className="text-sm mt-1 text-gray-700">{reportData.recommendation}</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ReportPage;