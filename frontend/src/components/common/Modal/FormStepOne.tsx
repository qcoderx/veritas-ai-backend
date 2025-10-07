interface FormStepOneProps {
  claimData: { fileCount: number; additionalInfo: string; files: File[] };
  setClaimData: (data: { fileCount: number; additionalInfo: string; files: File[] }) => void;
}

const FormStepOne = ({ claimData, setClaimData }: FormStepOneProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Claim Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Claimant Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter claimant name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Policy Number</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter policy number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Incident Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Claim Type</label>
          <select className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Auto Accident</option>
            <option>Property Damage</option>
            <option>Medical</option>
            <option>Theft</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Initial Notes</label>
        <textarea 
          rows={4}
          value={claimData.additionalInfo}
          onChange={(e) => setClaimData({ ...claimData, additionalInfo: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Enter any initial observations or suspicions..."
        ></textarea>
      </div>
    </div>
  );
};

export default FormStepOne;
