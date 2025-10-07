import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import ClaimDetail from './pages/ClaimDetail';
import AICopilot from './pages/AICopilot';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Report from './pages/Report';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// FontAwesome Icons Setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser, faEnvelope, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
library.add(faUser, faEnvelope, faPlus, faXmark);

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Landing Page - Default Route */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth Pages - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Dashboard Pages - With DashboardLayout */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><DashboardLayout><Claims /></DashboardLayout></ProtectedRoute>} />
        <Route path="/claims/:claimId" element={<ProtectedRoute><DashboardLayout><ClaimDetail /></DashboardLayout></ProtectedRoute>} />
        <Route path="/ai-copilot" element={<ProtectedRoute><DashboardLayout><AICopilot /></DashboardLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><DashboardLayout><Report /></DashboardLayout></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;