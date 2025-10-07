// src/layouts/AuthLayout.tsx

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    // Global container: Soft light gray background, full screen
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 antialiased font-sans">
      
      {/* Container Card: Premium shadow, slightly lifted on hover for delightful micro-animation */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 transform transition-all duration-500 hover:shadow-indigo-300/50 hover:-translate-y-0.5">
        
        <header className="text-center mb-8">
          {/* Branded Logo: Indigo for Veritas, Emerald for AI */}
          <h1 className="text-5xl font-extrabold text-indigo-700 tracking-tight">
            Veritas<span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-gray-500 mt-3 text-lg">Claim Verification Gateway</p>
          {/* The signature emerald separator line */}
          <div className="w-16 h-1 bg-emerald-500 mx-auto mt-4 rounded-full"></div> 
        </header>
        
        {children}
        
      </div>
    </div>
  );
};

export default AuthLayout;