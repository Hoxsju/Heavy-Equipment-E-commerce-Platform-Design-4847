import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requiredPermissions = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [permissionVerified, setPermissionVerified] = useState(false);

  useEffect(() => {
    // Simple check to verify permissions without causing infinite loops
    if (!loading) {
      // Set a short timeout to ensure React has time to update state
      const timer = setTimeout(() => {
        setPermissionVerified(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Show loading while checking authentication
  if (loading || !permissionVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading...' : 'Verifying permissions...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {loading ? 'Authenticating user...' : 'Checking admin privileges...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin permissions for admin-only routes
  if (adminOnly && !['admin', 'main_admin', 'sub_admin'].includes(user.role)) {
    console.log('ProtectedRoute: Access denied - user role:', user.role);
    return <Navigate to="/" replace />;
  }

  // Check specific route permissions for sub-admin restrictions
  if (user.role === 'sub_admin') {
    const currentPath = location.pathname;
    
    // Block access to import and settings for sub-admin
    if (currentPath.includes('/admin/import') || currentPath.includes('/admin/settings')) {
      console.log('ProtectedRoute: Sub-admin access denied to:', currentPath);
      return <Navigate to="/admin" replace />;
    }
  }

  // Check if user has specific required permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => {
      if (permission === 'main_admin') return user.role === 'main_admin';
      if (permission === 'admin') return ['admin', 'main_admin'].includes(user.role);
      if (permission === 'sub_admin') return ['sub_admin', 'admin', 'main_admin'].includes(user.role);
      return false;
    });

    if (!hasPermission) {
      console.log('ProtectedRoute: Insufficient permissions - required:', requiredPermissions, 'user role:', user.role);
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;