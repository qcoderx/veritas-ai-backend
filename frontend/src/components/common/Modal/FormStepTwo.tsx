import { useState, useEffect } from 'react';

interface FormStepTwoProps {
  claimData: { fileCount: number; additionalInfo: string; files: File[] };
  setClaimData: (data: { fileCount: number; additionalInfo: string; files: File[] }) => void;
}

const FormStepTwo = ({ claimData, setClaimData }: FormStepTwoProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  useEffect(() => {
    setClaimData({ fileCount: files.length, additionalInfo: claimData.additionalInfo, files });
  }, [files, setClaimData, claimData.additionalInfo]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Upload Evidence</h3>
      
      {/* File Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-400 mb-4"></i>
        <p className="text-lg text-white mb-2">Drag and drop files here</p>
        <p className="text-slate-400 mb-4">or</p>
        <label className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors">
          <i className="fa-solid fa-plus mr-2"></i>
          Choose Files
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">Supports: Images, Videos, PDFs, Documents</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Uploaded Files ({files.length})</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-file text-emerald-500"></i>
                  <div>
                    <p className="text-white text-sm">{file.name}</p>
                    <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormStepTwo;
