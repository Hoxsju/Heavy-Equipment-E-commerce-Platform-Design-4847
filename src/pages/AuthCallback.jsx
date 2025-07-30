import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import supabase from '../lib/supabase';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiLoader, FiCheckCircle, FiXCircle, FiAlertCircle, FiArrowLeft } = FiIcons;

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // To track specific error types
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('Processing auth callback...');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Hash params:', window.location.hash);

      // Parse URL parameters from both search and hash
      const searchParams = new URLSearchParams(window.location.search);
      let hashParams = new URLSearchParams();
      
      if (window.location.hash && window.location.hash.includes('?')) {
        // Handle hash fragments with query parameters
        const hashQuery = window.location.hash.split('?')[1];
        hashParams = new URLSearchParams(hashQuery);
      } else if (window.location.hash && window.location.hash.startsWith('#')) {
        hashParams = new URLSearchParams(window.location.hash.substring(1));
      }

      // Check for different auth parameters
      const code = searchParams.get('code');
      const token = searchParams.get('token') || hashParams.get('token');
      const type = searchParams.get('type') || hashParams.get('type');
      const error = searchParams.get('error') || hashParams.get('error');
      const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

      console.log('Auth callback parameters:', {
        code: code ? 'present' : 'missing',
        token: token ? 'present' : 'missing',
        type,
        error,
        errorCode,
        errorDescription
      });

      // Handle errors first
      if (error) {
        console.error('Auth callback error:', error, errorDescription);
        
        // Special handling for expired tokens
        if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
          setErrorType('expired');
          throw new Error('The link has expired. Please request a new password reset link.');
        }
        
        throw new Error(errorDescription || error);
      }

      // Handle authorization code flow (PKCE with code parameter)
      if (code) {
        console.log('Processing authorization code flow with code:', code);
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            throw exchangeError;
          }
          
          if (data?.session?.user) {
            console.log('User authenticated via code exchange:', data.session.user);
            await handleSuccessfulAuth(data.session, type);
            return;
          }
        } catch (exchangeError) {
          console.error('Failed to exchange code for session:', exchangeError);
          // Continue to try other methods instead of throwing
        }
      }

      // Handle PKCE token verification format (token=pkce_xxx)
      if (token && token.startsWith('pkce_')) {
        console.log('Processing PKCE token verification...');
        
        // For PKCE token verification, we need to get the session after the token is processed
        // The token is automatically processed by Supabase when the page loads
        // We just need to check if a session exists
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Session error:', sessionError);
            // Continue instead of throwing
          }
          
          if (session?.user) {
            console.log('User authenticated via PKCE token:', session.user);
            await handleSuccessfulAuth(session, type);
            return;
          } else {
            // Try to manually handle the token
            console.log('No session found, trying to manually process the token...');
            
            // Try refreshing the session
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Token refresh error:', refreshError);
              // Continue instead of throwing
            }
            
            if (data?.session?.user) {
              console.log('User authenticated after refresh:', data.session.user);
              await handleSuccessfulAuth(data.session, type);
              return;
            }
          }
        } catch (tokenError) {
          console.error('Error processing token:', tokenError);
          // Continue to next method
        }
      }

      // Try to get current session as fallback
      console.log('Trying to get current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Continue instead of throwing
      }
      
      if (session?.user) {
        console.log('User found in current session:', session.user);
        await handleSuccessfulAuth(session, type);
        return;
      }

      // If we got here with code but no session, we need a special recovery flow
      if (code) {
        console.log('Attempting recovery flow with code...');
        // Create a new URL with the code parameter and redirect
        const newUrl = `${window.location.origin}/#/auth/callback?code=${code}`;
        window.location.href = newUrl;
        return;
      }

      // No session found
      console.log('No session found in callback');
      throw new Error('No valid session found. Please try signing in again.');
      
    } catch (error) {
      console.error('Auth callback error:', error);
      setError(error.message || 'Authentication failed');
      toast.error('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (session, type) => {
    try {
      // Check if this is a password recovery
      if (type === 'recovery') {
        console.log('Password recovery detected, redirecting to reset password');
        toast.success('Please set your new password');
        navigate('/reset-password', { replace: true });
        return;
      }

      toast.success('Authentication successful!');
      
      // Clean up URL by removing auth parameters
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Redirect based on user role or metadata
      const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role || 'user';
      console.log('User role determined:', userRole);
      
      if (userRole === 'admin' || userRole === 'main_admin') {
        console.log('Redirecting admin user to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Redirecting regular user to /profile');
        navigate('/profile', { replace: true });
      }
    } catch (error) {
      console.error('Error handling successful auth:', error);
      // Still redirect to profile as fallback
      navigate('/profile', { replace: true });
    }
  };

  const handleRequestNewPasswordReset = () => {
    navigate('/forgot-password', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SafeIcon icon={FiLoader} className="h-8 w-8 text-primary-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Authentication</h2>
          <p className="text-gray-600">Please wait while we verify your account...</p>
        </div>
      </div>
    );
  }

  // Special view for expired tokens
  if (errorType === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <SafeIcon icon={FiAlertCircle} className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-6">
            The password reset link has expired. For security reasons, these links are only valid for 24 hours.
          </p>
          <button
            onClick={handleRequestNewPasswordReset}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 w-full mb-3"
          >
            Request New Reset Link
          </button>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 w-full flex items-center justify-center"
          >
            <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-2" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <SafeIcon icon={FiXCircle} className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 w-full"
            >
              Back to Login
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 w-full"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <SafeIcon icon={FiCheckCircle} className="h-8 w-8 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful</h2>
        <p className="text-gray-600">Redirecting you now...</p>
      </div>
    </div>
  );
};

export default AuthCallback;