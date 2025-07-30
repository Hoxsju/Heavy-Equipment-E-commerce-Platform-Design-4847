import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        // First check localStorage for demo accounts
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Found user in localStorage:', userData);
          setUser(userData);
          setLoading(false);
          return;
        }
        
        // Otherwise try to get from Supabase session
        const userData = await authService.getCurrentUser();
        if (userData) {
          console.log('Found existing user session:', userData);
          setUser(userData);
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle user role and status updates
  useEffect(() => {
    if (!user) return;
    
    const handleUserRoleUpdate = (e) => {
      const { userId, newRole } = e.detail;
      if (user && user.id === userId) {
        console.log(`User role changed from ${user.role} to ${newRole}`);
        setUser(prev => ({ ...prev, role: newRole }));
      }
    };

    const handleUserStatusUpdate = (e) => {
      const { userId, newStatus } = e.detail;
      if (user && user.id === userId) {
        setUser(prev => ({ ...prev, status: newStatus }));
        
        if (newStatus === 'suspended') {
          toast.error('Your account has been suspended. You will be logged out.');
          setTimeout(() => logout(), 2000);
        }
      }
    };

    window.addEventListener('userRoleUpdated', handleUserRoleUpdate);
    window.addEventListener('userStatusUpdated', handleUserStatusUpdate);
    
    return () => {
      window.removeEventListener('userRoleUpdated', handleUserRoleUpdate);
      window.removeEventListener('userStatusUpdated', handleUserStatusUpdate);
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      // Handle demo accounts directly
      if (email === 'admin@demo.com' || email === 'demo@demo.com') {
        const demoUser = {
          id: email === 'admin@demo.com' ? 'demo-admin-id' : 'demo-user-id',
          email: email,
          firstName: email === 'admin@demo.com' ? 'Admin' : 'Demo',
          lastName: 'User',
          role: email === 'admin@demo.com' ? 'admin' : 'user'
        };
        
        setUser(demoUser);
        localStorage.setItem('auth_user', JSON.stringify(demoUser));
        return { user: demoUser };
      }
      
      // Regular login via service
      const response = await authService.login(email, password);
      setUser(response.user);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      // Only set user if email is confirmed (main admin)
      if (response.user && !response.message) {
        setUser(response.user);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      
      // Update user in state
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state and storage
      setUser(null);
      localStorage.removeItem('auth_user');
      toast.success("Logged out successfully");
    }
  };

  // Simplified refreshCurrentUser function that won't cause loops
  const refreshCurrentUser = async () => {
    if (!user) return null;
    
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return userData;
      }
      return user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return user;
    }
  };

  const value = {
    user,
    login,
    register,
    updateProfile,
    logout,
    refreshCurrentUser,
    loading,
    isAdmin: user?.role === 'admin' || user?.role === 'main_admin' || user?.role === 'sub_admin',
    isMainAdmin: user?.role === 'main_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };