import { useAppSelector } from '../redux/store';

const Settings = () => {
  const user = useAppSelector((state) => state.auth.user);
  
  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Settings
        </h2>
      </div>

      {/* Settings Card */}
      <div className="max-w-2xl">
        <div className="p-8 bg-slate-800 rounded-lg">
          <h3 className="text-xl font-semibold mb-6 text-white">
            Profile Information
          </h3>
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-400">
                Full Name
              </label>
              <input 
                type="text" 
                defaultValue={user?.firstName || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-400">
                Email Address
              </label>
              <input 
                type="email" 
                defaultValue={user?.email || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-400">
                New Password
              </label>
              <input 
                type="password" 
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="pt-4">
              <button 
                type="submit"
                className="px-6 py-3 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;