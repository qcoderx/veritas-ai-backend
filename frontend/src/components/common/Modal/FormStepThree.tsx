interface FormStepThreeProps {
  claimId: string | null;
}

const FormStepThree = ({ claimId }: FormStepThreeProps) => {
  return (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <i className="fa-solid fa-check-circle text-6xl text-emerald-500 mb-4"></i>
        <h3 className="text-2xl font-semibold text-white mb-2">Claim Created Successfully!</h3>
        <p className="text-slate-300">Your claim has been submitted and is ready for AI analysis.</p>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-600">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-slate-400 text-sm">Claim ID</p>
            <p className="text-white font-mono">{claimId || 'Generating...'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-yellow-400 bg-yellow-400 bg-opacity-10">
              Pending Analysis
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Created</p>
            <p className="text-white">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Files Uploaded</p>
            <p className="text-white">3 files</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
        <div className="flex items-center gap-3 text-left">
          <i className="fa-solid fa-info-circle text-blue-400"></i>
          <div>
            <p className="text-white font-medium">Next Steps</p>
            <p className="text-slate-400 text-sm">Forensic analysis pipeline has been triggered. Bedrock AI is now processing all uploaded documents for fraud detection.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStepThree;
