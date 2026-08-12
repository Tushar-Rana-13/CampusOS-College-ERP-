import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Wrapper
 * @param {Array<string>} allowedRoles - Optional array of permitted roles (e.g., ['student', 'admin'])
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // 1. Show a clean spinner while reading session from localStorage
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading CampusOS...</p>
        </div>
      </div>
    );
  }

  // 2. Redirect to Login if unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check Role Authorization if allowedRoles are specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their respective default dashboard
    const defaultRedirect = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  // 4. Render child routes if authorized
  return <Outlet />;
}