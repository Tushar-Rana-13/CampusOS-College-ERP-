import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Wrapper
 * Enforces authentication and role-based access control (RBAC).
 *
 * @param {Array<string>} allowedRoles - Permitted roles (e.g., ['student', 'faculty', 'admin'])
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // 1. Show loading state while verifying JWT / Auth state
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

  // 2. Redirect unauthenticated users to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Handle Role Authorization (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.includes(user.role);

    if (!isAuthorized) {
      // Map user role directly to their assigned portal dashboard
      const roleDashboards = {
        student: '/student/dashboard',
        faculty: '/faculty/dashboard',
        admin: '/admin/dashboard',
      };

      const fallbackRoute = roleDashboards[user.role] || '/login';
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // 4. Authorized -> Render nested route components via Outlet
  return <Outlet />;
}