import { useAppDispatch, useAppSelector } from "../redux/store";
import { setIsOpen } from "../components/features/Modal/toggleModalSlice";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

import MultiStepFormModal from "../components/common/Modal/MultiStepFormModal";

const Claims = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector((state) => state.modal.isOpen);
  const { token } = useAppSelector((state) => state.auth);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await apiService.getClaims(token);
        setClaims(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('Failed to fetch claims:', error);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [token, isOpen]);
  
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    if (status === 'Pending') {
      return `${baseClasses} text-yellow-400 bg-yellow-400 bg-opacity-10`;
    }
    return `${baseClasses} text-green-400 bg-green-400 bg-opacity-10`;
  };
  
  const getRiskBar = (score: number) => {
    if (score > 80) return 'bg-red-500';
    if (score > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">
          All Claims
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search claims..."
              className="pl-12 pr-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white w-80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => dispatch(setIsOpen(true))}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <i className="fa-solid fa-plus"></i>
            New Claim
          </button>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Claimant</th>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Claim ID</th>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Policy #</th>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date Filed</th>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Fraud Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-slate-400">Loading claims...</p>
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <p className="text-slate-400">No claims found. Create your first claim!</p>
                </td>
              </tr>
            ) : (
              claims.map((claim, index) => (
                <tr 
                  key={claim.id || index} 
                  onClick={() => navigate(`/claims/${claim.id}`)}
                  className="border-b border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <td className="p-5 text-white">{claim.adjuster_id || 'N/A'}</td>
                  <td className="p-5">
                    <span className="font-mono text-sm text-slate-400">
                      {claim.id}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="font-mono text-sm text-slate-400">
                      N/A
                    </span>
                  </td>
                  <td className="p-5 text-white">{new Date(claim.created_at).toLocaleDateString()}</td>
                  <td className="p-5">
                    <span className={getStatusBadge(claim.status === 'upload_in_progress' ? 'Pending' : 'Analyzed')}>
                      {claim.status === 'upload_in_progress' ? 'Pending' : 'Analyzed'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <span className="text-white">{claim.fraud_risk_score || 0}%</span>
                      <div className="w-24 h-2 bg-slate-600 rounded-full">
                        <div 
                          className={`h-full rounded-full ${getRiskBar(claim.fraud_risk_score || 0)}`}
                          style={{ width: `${claim.fraud_risk_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {isOpen && <MultiStepFormModal />}
    </div>
  );
};

export default Claims;
