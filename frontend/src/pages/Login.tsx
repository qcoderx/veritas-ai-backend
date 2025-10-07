import React, { useState } from 'react';
 
import { Link, useNavigate } from 'react-router-dom'; 
import AuthLayout from '../layouts/AuthLayout';
 
import { useAppDispatch, useAppSelector } from '../redux/store'; 
 
import { authRequest, authSuccess, authFailure } from '../features/auth/authSlice';
import { IoLogIn } from 'react-icons/io5';
import { apiService } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Redux State Reading (Types are now correctly inferred by TypeScript)
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      dispatch(authFailure('Please enter both email and password.'));
      return;
    }

    dispatch(authRequest());

    try {
      const response = await apiService.login({ email, password });
      
      if (response.access_token) {
        // Extract name from email for better personalization
        const emailName = email.split('@')[0];
        const firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        
        const user = { 
          id: 'user-' + Date.now(), 
          email, 
          firstName, 
          role: 'Adjuster' as const 
        };
        
        dispatch(authSuccess({ user, token: response.access_token }));
        navigate('/dashboard');
      } else {
        dispatch(authFailure(response.message || 'Invalid email or password. Please try again.'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      dispatch(authFailure(errorMessage));
    }
  };

  return (
    <AuthLayout>
      {/* Back to Landing Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-emerald-600 transition-colors duration-200"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back to Landing
        </button>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 flex items-center justify-center">
        <IoLogIn className="h-6 w-6 mr-2 text-indigo-500" />
        Agent Sign In
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login Form">
        
        {/* Email Input */}
        <div className="group">
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       transition duration-200 outline-none placeholder-gray-400"
            placeholder="e.g., bola@veritas.ai"
          />
        </div>

        {/* Password Input */}
        <div className="group">
          <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       transition duration-200 outline-none"
            placeholder="••••••••"
          />
        </div>

        {/* Error Message Display */}
        {error && (
          <div role="alert" className="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg transition-opacity duration-300">
            {error}
          </div>
        )}

        {/* Submit Button (UX Optimized with Loading Spinner) */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white 
            ${isLoading 
                ? 'bg-indigo-400 cursor-progress' 
                : 'bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800'} 
            focus:outline-none focus:ring-4 focus:ring-indigo-500/50 
            transition-all duration-300 ease-in-out transform hover:scale-[1.01]`}
          aria-live="assertive"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <IoLogIn className="h-5 w-5 mr-2" />
              Sign In to Veritas AI
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 transition duration-200">
          Register Here
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;