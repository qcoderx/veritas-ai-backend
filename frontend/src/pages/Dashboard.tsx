import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/store';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { token } = useAppSelector((state) => state.auth);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    highRisk: 0,
    processedToday: 0
  });

  useEffect(() => {
    const fetchRecentClaims = async () => {
      if (!token) return;
      
      try {
        const claims = await apiService.getClaims(token);
        const claimsArray = Array.isArray(claims) ? claims : [];
        
        // Sort by created_at and take last 5
        const sortedClaims = claimsArray
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setRecentClaims(sortedClaims);
        
        // Calculate stats
        const pending = claimsArray.filter(c => c.status === 'upload_in_progress').length;
        const highRisk = claimsArray.filter(c => c.fraud_risk_score && c.fraud_risk_score > 70).length;
        const today = new Date().toDateString();
        const processedToday = claimsArray.filter(c => 
          new Date(c.created_at).toDateString() === today
        ).length;
        
        setStats({
          total: claimsArray.length,
          pending,
          highRisk,
          processedToday
        });
      } catch (error) {
        console.error('Failed to fetch recent claims:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentClaims();
  }, [token]);

  const getStatusBadge = (status: string, riskScore: number | null) => {
    if (riskScore && riskScore > 70) {
      return <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">High Risk</span>;
    }
    if (status === 'upload_in_progress') {
      return <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">Pending</span>;
    }
    return <span className="bg-emerald-500 text-white px-2 py-1 rounded text-sm">Analyzed</span>;
  };

  const getRiskColor = (score: number | null) => {
    if (!score) return 'text-slate-400';
    if (score > 70) return 'text-red-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-slate-300">Your AI-powered claims investigation platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Claims</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.total}</p>
            </div>
            <i className="fa-solid fa-file-invoice text-2xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 hover:border-yellow-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.pending}</p>
            </div>
            <i className="fa-solid fa-clock text-2xl text-yellow-500"></i>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 hover:border-red-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Risk</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.highRisk}</p>
            </div>
            <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Processed Today</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.processedToday}</p>
            </div>
            <i className="fa-solid fa-check-circle text-2xl text-emerald-500"></i>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-600">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/claims')}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            New Claim Analysis
          </button>
          <button 
            onClick={() => navigate('/claims')}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <i className="fa-solid fa-list mr-2"></i>
            View All Claims
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white p-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <i className="fa-solid fa-chart-bar mr-2"></i>
            View Reports
          </button>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-600">
        <h2 className="text-xl font-bold text-white mb-4">Recent Claims</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-3 px-4 text-slate-300">Claim ID</th>
                <th className="text-left py-3 px-4 text-slate-300">Status</th>
                <th className="text-left py-3 px-4 text-slate-300">Risk Score</th>
                <th className="text-left py-3 px-4 text-slate-300">Date</th>
                <th className="text-left py-3 px-4 text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Loading recent claims...
                  </td>
                </tr>
              ) : recentClaims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No claims found. Create your first claim!
                  </td>
                </tr>
              ) : (
                recentClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="py-3 px-4 text-white">{claim.id}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(claim.status, claim.fraud_risk_score)}
                    </td>
                    <td className={`py-3 px-4 font-bold ${getRiskColor(claim.fraud_risk_score)}`}>
                      {claim.fraud_risk_score ? `${claim.fraud_risk_score}%` : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => navigate(`/claims/${claim.id}`)}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;