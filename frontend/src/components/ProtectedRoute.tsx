import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/store';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAppSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;