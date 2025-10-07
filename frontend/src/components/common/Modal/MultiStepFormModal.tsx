
import Icons from "../icons/Icons.tsx";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { nextStep, previousStep, resetStep } from "../../features/Modal/formSlice.ts";
import { setIsOpen } from "../../features/Modal/toggleModalSlice";
import { useEffect, useState } from 'react';
import FormStepOne from "./FormStepOne.tsx";
import FormStepTwo from "./FormStepTwo.tsx";
import { apiService } from '../../../services/api';

type ProcessStep = 'uploading' | 'ready' | 'analyzing' | 'results';

const MultiStepFormModal = () => {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.form.step);
  const { token } = useAppSelector((state) => state.auth);
  const [claimData, setClaimData] = useState({ fileCount: 0, additionalInfo: '', files: [] as File[] });
  const [processStep, setProcessStep] = useState<ProcessStep | null>(null);
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  useEffect(() => {
    dispatch(resetStep());
  }, [dispatch]);

  const handleSubmitClaim = async () => {
    if (!token || claimData.files.length === 0) return;
    
    setProcessStep('uploading');
    setStatusMessage('Creating claim...');
    
    try {
      const response = await apiService.createClaim(
        claimData.files.length,
        claimData.additionalInfo,
        token
      );
      
      setCreatedClaimId(response.claim_id);
      setStatusMessage(`Claim ${response.claim_id} created. Uploading files...`);
      
      // Upload files with progress tracking
      let uploadedCount = 0;
      const uploadPromises = response.upload_urls.map((urlData: any, i: number) => {
        const formData = new FormData();
        Object.keys(urlData.fields).forEach(key => {
          formData.append(key, urlData.fields[key]);
        });
        formData.append('file', claimData.files[i]);
        
        return fetch(urlData.url, { method: 'POST', body: formData }).then(() => {
          uploadedCount++;
          setUploadProgress((uploadedCount / claimData.files.length) * 100);
        });
      });
      
      await Promise.all(uploadPromises);
      setStatusMessage('All files uploaded successfully. Ready to run analysis.');
      setProcessStep('ready');
      
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  const handleRunAnalysis = async () => {
    if (!token || !createdClaimId) return;
    
    setProcessStep('analyzing');
    setStatusMessage(`Analysis triggered for claim ${createdClaimId}. This may take a while...`);
    
    try {
      const results = await apiService.triggerAnalysis(createdClaimId, token);
      setAnalysisResults(results);
      setProcessStep('results');
    } catch (error: any) {
      setStatusMessage(`Error triggering analysis: ${error.message}`);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score > 75) return 'text-red-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-green-400';
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-4/5 max-w-4xl h-4/5 bg-slate-800 text-center shadow-2xl rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-white text-3xl font-semibold">
              {processStep ? (
                processStep === 'uploading' ? 'Processing' :
                processStep === 'ready' ? 'Ready for Analysis' :
                processStep === 'analyzing' ? 'Running Analysis' :
                'Analysis Complete'
              ) : 'Create New Claim'}
            </h2>
            {!processStep && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2].map((stepNum) => (
                  <div key={stepNum} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNum ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-400'
                  }`}>
                    {stepNum}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => dispatch(setIsOpen(false))}>
            <Icons className="text-gray-600 text-2xl " name="xmark" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {!processStep && (
            <>
              {step === 1 && <FormStepOne claimData={claimData} setClaimData={setClaimData} />}
              {step === 2 && <FormStepTwo claimData={claimData} setClaimData={setClaimData} />}
            </>
          )}
          
          {(processStep === 'uploading' || processStep === 'ready') && (
            <div className="space-y-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300">{statusMessage}</p>
                {processStep === 'uploading' && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{uploadProgress.toFixed(0)}% complete</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {processStep === 'analyzing' && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-300">{statusMessage}</p>
            </div>
          )}
          
          {processStep === 'results' && analysisResults && (
            <div className="space-y-6">
              <div className="bg-slate-700 p-6 rounded-lg">
                <h3 className="text-white text-xl font-semibold mb-4">Fraud Risk Report</h3>
                <div className={`text-6xl font-bold text-center mb-4 ${getRiskScoreColor(analysisResults.fraud_risk_score)}`}>
                  {analysisResults.fraud_risk_score}%
                </div>
                <p className="text-slate-300 mb-4">
                  <strong>Summary:</strong> {analysisResults.summary}
                </p>
                {analysisResults.key_risk_factors && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Key Risk Factors:</h4>
                    <ul className="space-y-2">
                      {analysisResults.key_risk_factors.map((factor: string, i: number) => (
                        <li key={i} className="bg-slate-600 p-3 rounded text-slate-300">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4">
          {!processStep && step > 1 && (
            <button
              onClick={() => dispatch(previousStep())}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Previous
            </button>
          )}
          
          {!processStep && step < 2 && (
            <button
              onClick={() => dispatch(nextStep())}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors ml-auto"
            >
              Next
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          )}
          
          {!processStep && step === 2 && (
            <button
              onClick={handleSubmitClaim}
              disabled={claimData.files.length === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg transition-colors ml-auto"
            >
              Create Claim & Upload Files
            </button>
          )}
          
          {processStep === 'ready' && (
            <button
              onClick={handleRunAnalysis}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Run Final Analysis
            </button>
          )}
          
          {(processStep === 'results' || processStep === 'analyzing') && (
            <button
              onClick={() => dispatch(setIsOpen(false))}
              disabled={processStep === 'analyzing'}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              {processStep === 'analyzing' ? 'Analysis in Progress...' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepFormModal;
