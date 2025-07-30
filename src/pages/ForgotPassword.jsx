import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiLock, FiInfo, FiAlertCircle, FiCheckCircle, FiClock } = FiIcons;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [lastResetTime, setLastResetTime] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer for rate limiting
  React.useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Check if we need to wait due to rate limiting
    if (lastResetTime) {
      const timeSinceLastReset = Date.now() - lastResetTime;
      const waitTime = 20000; // 20 seconds to be safe
      
      if (timeSinceLastReset < waitTime) {
        const remainingTime = Math.ceil((waitTime - timeSinceLastReset) / 1000);
        setCountdown(remainingTime);
        toast.warning(`Please wait ${remainingTime} seconds before requesting another reset link`);
        return;
      }
    }

    setLoading(true);
    
    try {
      const result = await authService.requestPasswordReset(email);
      setResetEmailSent(true);
      setResetAttempts(prev => prev + 1);
      setLastResetTime(Date.now());
      toast.success(result.message || 'Password reset link sent to your email!');
    } catch (error) {
      console.error('Password reset request error:', error);
      
      // Handle rate limiting error specifically
      if (error.message && error.message.includes('18 seconds')) {
        setCountdown(20); // Set countdown to 20 seconds
        toast.warning('Please wait 20 seconds before requesting another reset link');
        setLastResetTime(Date.now());
      } else {
        switch(error.message) {
          case 'USER_NOT_FOUND':
            toast.error('No account found with this email address.');
            break;
          default:
            toast.error('Failed to send reset link. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <SafeIcon icon={FiLock} className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {resetEmailSent 
              ? 'Check your email for the password reset link' 
              : 'Enter your email address and we\'ll send you a reset link'
            }
          </p>
        </div>

        {/* Rate Limiting Warning */}
        {countdown > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <SafeIcon icon={FiClock} className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-sm font-medium text-yellow-900">Please Wait</h3>
            </div>
            <p className="text-sm text-yellow-700">
              For security reasons, you must wait <strong>{countdown} seconds</strong> before requesting another password reset link.
            </p>
          </div>
        )}

        {resetEmailSent && resetAttempts > 1 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-sm font-medium text-amber-900">Multiple Reset Attempts</h3>
            </div>
            <p className="text-sm text-amber-700">
              We've sent you multiple password reset links. Please use the most recent one, as previous links may have expired.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-sm font-medium text-blue-900">Secure Reset Process</h3>
            </div>
            <p className="text-sm text-blue-700">
              {resetEmailSent 
                ? 'A password reset link has been sent to your email. Click the link to create a new password. The link will expire after 24 hours for security reasons.'
                : 'We\'ll send a secure link to your email that will allow you to reset your password. For security reasons, the link will expire after 24 hours.'
              }
            </p>
          </div>
        )}

        {!resetEmailSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || countdown > 0}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending reset link...
                  </span>
                ) : countdown > 0 ? (
                  `Wait ${countdown} seconds`
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <SafeIcon icon={FiCheckCircle} className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-green-800">Email Sent</h3>
              </div>
              <p className="text-green-800">
                Check your email inbox for the password reset link. The link will expire after 24 hours.
              </p>
            </div>

            <button
              onClick={() => setResetEmailSent(false)}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Send to a different email address
            </button>

            <button
              onClick={handleEmailSubmit}
              disabled={loading || countdown > 0}
              className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Resending...
                </span>
              ) : countdown > 0 ? (
                `Wait ${countdown} seconds to resend`
              ) : (
                'Resend Reset Link'
              )}
            </button>
          </div>
        )}

        <div className="text-center">
          <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;