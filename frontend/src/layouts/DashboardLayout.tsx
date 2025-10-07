import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logout } from '../features/auth/authSlice';
import { IoLogOut, IoDocumentText, IoBarChart, IoSettings } from 'react-icons/io5';
import { FaBrain } from 'react-icons/fa';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: IoBarChart },
    { path: '/claims', label: 'Claims', icon: IoDocumentText },
    { path: '/ai-copilot', label: 'AI Co-Pilot', icon: FaBrain },
    { path: '/reports', label: 'Reports', icon: IoBarChart },
    { path: '/settings', label: 'Settings', icon: IoSettings },
  ];

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="text-3xl font-bold text-emerald-500">
            V<span className="text-white">eritas</span>
          </div>
        </div>
        
        <nav className="mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 border-l-4 ${
                  isActive
                    ? 'bg-slate-900 text-white border-emerald-500'
                    : 'text-slate-400 border-transparent hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={`https://i.pravatar.cc/40?u=${user?.email || 'default'}`} 
              alt="User Avatar" 
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-semibold text-sm text-white">
                {user?.firstName || 'User'}
              </div>
              <div className="text-xs text-slate-400">
                {user?.role || 'Claims Adjuster'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Logout"
          >
            <IoLogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;