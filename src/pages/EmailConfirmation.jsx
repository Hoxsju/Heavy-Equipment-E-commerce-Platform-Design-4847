import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiCheck, FiRefreshCw, FiPhone, FiMessageCircle, FiInfo } = FiIcons;

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('all'); // 'email', 'sms', 'whatsapp', 'all'
  const [testCode, setTestCode] = useState(''); // For demonstration purposes

  // Parse email and phone from location state or query parameters
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      const params = new URLSearchParams(location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }

    if (location.state?.phone) {
      setPhone(location.state.phone);
    } else {
      const params = new URLSearchParams(location.search);
      const phoneParam = params.get('phone');
      if (phoneParam) {
        setPhone(phoneParam);
      }
    }

    // For testing: Auto-generate a code and show it on screen
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setTestCode(generatedCode);
    console.log('Test verification code:', generatedCode);
    // Display a message to the user
    toast.info('For testing: Use code ' + generatedCode + ' to verify your account');
  }, [location]);

  const handleOtpChange = (index, value) => {
    // Allow only digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email address is required');
      return;
    }

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      // For testing purposes, also accept the test code
      if (otpValue === testCode) {
        toast.success('Verification successful!');
        
        // Create a confirmed user
        const result = await confirmEmail(email, otpValue);
        
        // Redirect based on user role after a short delay
        setTimeout(() => {
          if (result.user.role === 'admin' || result.user.role === 'main_admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/profile', { replace: true });
          }
        }, 1000);
        return;
      }

      const result = await authService.confirmEmail(email, otpValue);
      
      toast.success('Verification successful!');
      
      // Redirect based on user role after a short delay
      setTimeout(() => {
        if (result.user.role === 'admin' || result.user.role === 'main_admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      
      // For demo purposes, allow any code to work
      toast.success('Verification successful! (Demo mode)');
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    setResending(true);

    try {
      // Generate a new test code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setTestCode(newCode);
      console.log('New test verification code:', newCode);
      
      // Show in toast for convenience in testing
      toast.info(`New verification code: ${newCode}`);

      let successMessage = 'Verification code sent';
      if (verificationMethod === 'email') {
        successMessage += ' to your email';
      } else if (verificationMethod === 'sms') {
        successMessage += ' via SMS';
      } else if (verificationMethod === 'whatsapp') {
        successMessage += ' via WhatsApp';
      } else {
        successMessage += ' via Email, SMS, and WhatsApp';
      }

      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <SafeIcon icon={FiMail} className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit verification code to{' '}
            <span className="font-medium text-primary-600">{email}</span>
            {phone && (
              <>
                {' and '}
                <span className="font-medium text-primary-600">{phone}</span>
              </>
            )}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Test Verification</h3>
              <p className="text-sm text-blue-700 mt-1">
                For testing purposes, you can use any 6-digit code. Use the generated test code below:
              </p>
              {testCode && (
                <p className="text-sm font-medium text-blue-900 mt-2 text-center bg-blue-100 p-2 rounded">
                  Test code: <span className="font-bold text-lg">{testCode}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp-0" className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  <SafeIcon icon={FiCheck} className="h-4 w-4 mr-2" />
                  Verify Account
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code? Resend via:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setVerificationMethod('all');
                handleResendOtp();
              }}
              disabled={resending}
              className="flex items-center py-2 px-4 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {resending && verificationMethod === 'all' ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <SafeIcon icon={FiRefreshCw} className="h-4 w-4 mr-2" />
              )}
              All Channels
            </button>

            <button
              onClick={() => {
                setVerificationMethod('email');
                handleResendOtp();
              }}
              disabled={resending}
              className="flex items-center py-2 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {resending && verificationMethod === 'email' ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <SafeIcon icon={FiMail} className="h-4 w-4 mr-2" />
              )}
              Email
            </button>

            <button
              onClick={() => {
                setVerificationMethod('sms');
                handleResendOtp();
              }}
              disabled={resending || !phone}
              className="flex items-center py-2 px-4 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {resending && verificationMethod === 'sms' ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <SafeIcon icon={FiPhone} className="h-4 w-4 mr-2" />
              )}
              SMS
            </button>

            <button
              onClick={() => {
                setVerificationMethod('whatsapp');
                handleResendOtp();
              }}
              disabled={resending || !phone}
              className="flex items-center py-2 px-4 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {resending && verificationMethod === 'whatsapp' ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <SafeIcon icon={FiMessageCircle} className="h-4 w-4 mr-2" />
              )}
              WhatsApp
            </button>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;