import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { authService } from './services/authService';
import { emailService } from './services/emailService';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiSend, FiCheck, FiInfo, FiRefreshCw, FiUser, FiMessageCircle, FiShield, FiSettings } = FiIcons;

const EmailTest = ({ embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('Test User');
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const runSupabaseTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing Supabase OTP email system...');
      const connectionResult = await authService.testEmailConnection();
      
      setResult({
        success: connectionResult.success,
        data: connectionResult,
        type: 'connection'
      });
      
      if (connectionResult.success) {
        toast.success('Supabase OTP email system is working!');
      } else {
        toast.error(`Email system test failed: ${connectionResult.error}`);
      }
    } catch (error) {
      console.error('Supabase email test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'connection'
      });
      toast.error(`Email test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testOTPRegistration = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.warning('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing OTP registration email for ${testEmail}...`);
      
      const registrationResult = await authService.register({
        email: testEmail,
        password: 'testPassword123',
        firstName: testName.split(' ')[0] || 'Test',
        lastName: testName.split(' ')[1] || 'User'
      });
      
      setResult({
        success: true,
        data: registrationResult,
        type: 'otp_registration',
        email: testEmail,
        otpCode: registrationResult.otpCode,
        emailResult: registrationResult.emailResult
      });
      
      if (registrationResult.needsConfirmation) {
        toast.success(`Registration email sent! OTP code: ${registrationResult.otpCode}`);
      } else {
        toast.success('Registration successful! No OTP needed.');
      }
    } catch (error) {
      console.error('OTP registration test failed:', error);
      
      if (error.message && error.message.includes('ACCOUNT_EXISTS')) {
        toast.info(`Account exists for ${testEmail}. Testing password reset OTP instead.`);
        
        try {
          const resetResult = await authService.requestPasswordReset(testEmail);
          
          setResult({
            success: true,
            data: resetResult,
            type: 'password_reset_otp',
            email: testEmail,
            otpCode: resetResult.otpCode,
            emailResult: resetResult.emailResult
          });
          
          toast.success(`Password reset email sent! Code: ${resetResult.otpCode}`);
        } catch (resetError) {
          setResult({
            success: false,
            error: resetError.message || 'Unknown error',
            type: 'password_reset_otp'
          });
          toast.error(`Password reset failed: ${resetError.message || 'Unknown error'}`);
        }
      } else {
        setResult({
          success: false,
          error: error.message || 'Unknown error',
          type: 'otp_registration'
        });
        toast.error(`Registration test failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testOTPLogin = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing OTP login email for ${testEmail}...`);
      
      const loginResult = await authService.login(testEmail, 'testPassword123');
      
      setResult({
        success: true,
        data: loginResult,
        type: 'otp_login',
        email: testEmail,
        otpCode: loginResult.otpCode,
        emailResult: loginResult.emailResult
      });
      
      if (loginResult.needsConfirmation) {
        toast.success(`Login verification email sent! Code: ${loginResult.otpCode}`);
      } else {
        toast.success('Login successful! No OTP needed.');
      }
    } catch (error) {
      console.error('OTP login test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'otp_login'
      });
      toast.error(`Login test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testPasswordResetOTP = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing password reset OTP email for ${testEmail}...`);
      
      const resetResult = await authService.requestPasswordReset(testEmail);
      
      setResult({
        success: true,
        data: resetResult,
        type: 'password_reset_otp',
        email: testEmail,
        otpCode: resetResult.otpCode,
        emailResult: resetResult.emailResult
      });
      
      toast.success(`Password reset email sent! Code: ${resetResult.otpCode}`);
    } catch (error) {
      console.error('Password reset OTP test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'password_reset_otp'
      });
      toast.error(`Password reset test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testResendOTP = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing resend OTP email for ${testEmail}...`);
      
      const resendResult = await authService.resendOTP(testEmail);
      
      setResult({
        success: true,
        data: resendResult,
        type: 'resend_otp',
        email: testEmail,
        otpCode: resendResult.otpCode,
        emailResult: resendResult.emailResult
      });
      
      toast.success(`OTP resent successfully! Code: ${resendResult.otpCode}`);
    } catch (error) {
      console.error('Resend OTP test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'resend_otp'
      });
      toast.error(`Resend OTP failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const templates = await emailService.getEmailTemplates();
      setEmailTemplates(templates);
      setShowTemplates(true);
    } catch (error) {
      console.error('Error loading email templates:', error);
      toast.error('Failed to load email templates');
    }
  };

  const containerClass = embedded 
    ? "bg-white rounded-lg shadow-sm p-6" 
    : "max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md";

  return (
    <div className={containerClass}>
      <div className="flex items-center mb-4">
        <SafeIcon icon={FiShield} className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Supabase OTP Email System Testing</h2>
      </div>
      
      {/* Test Email Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <SafeIcon icon={FiMail} className="inline h-4 w-4 mr-1" />
          Test Email Address
        </label>
        <input 
          type="email" 
          value={testEmail} 
          onChange={(e) => setTestEmail(e.target.value)} 
          placeholder="Enter email for OTP testing"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={loading} 
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter an email address where you want to receive test OTP emails
        </p>
      </div>
      
      {/* Test Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <SafeIcon icon={FiUser} className="inline h-4 w-4 mr-1" />
          Test Recipient Name
        </label>
        <input 
          type="text" 
          value={testName} 
          onChange={(e) => setTestName(e.target.value)} 
          placeholder="Test User"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={loading} 
        />
      </div>
      
      {/* Current Configuration Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <SafeIcon icon={FiInfo} className="h-4 w-4 mr-1" />
          Supabase OTP Email System Configuration
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>🔐 <strong>Email Provider:</strong> Supabase Auth Email System</p>
          <p>📧 <strong>Registration:</strong> Custom email template with OTP</p>
          <p>🔑 <strong>Login:</strong> Login verification email with OTP</p>
          <p>🔄 <strong>Password Reset:</strong> Password reset email with OTP</p>
          <p>⏰ <strong>Expiry:</strong> OTP codes expire after 15 minutes</p>
          <p>🎯 <strong>Targeting:</strong> Each email type has a specific purpose</p>
        </div>
      </div>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={runSupabaseTest}
          disabled={loading}
          className={`py-2 px-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'connection' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiRefreshCw} className="h-4 w-4 mr-2" />
              Test Email System
            </>
          )}
        </button>
        
        <button
          onClick={testOTPRegistration}
          disabled={loading || !testEmail.trim()}
          className={`py-2 px-4 rounded-lg ${loading || !testEmail.trim() ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'otp_registration' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiUser} className="h-4 w-4 mr-2" />
              Test Registration Email
            </>
          )}
        </button>
        
        <button
          onClick={testOTPLogin}
          disabled={loading || !testEmail.trim()}
          className={`py-2 px-4 rounded-lg ${loading || !testEmail.trim() ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'otp_login' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiSend} className="h-4 w-4 mr-2" />
              Test Login Email
            </>
          )}
        </button>
        
        <button
          onClick={testPasswordResetOTP}
          disabled={loading || !testEmail.trim()}
          className={`py-2 px-4 rounded-lg ${loading || !testEmail.trim() ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'password_reset_otp' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiMessageCircle} className="h-4 w-4 mr-2" />
              Test Password Reset Email
            </>
          )}
        </button>
        
        <button
          onClick={testResendOTP}
          disabled={loading || !testEmail.trim()}
          className={`py-2 px-4 rounded-lg ${loading || !testEmail.trim() ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'resend_otp' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiRefreshCw} className="h-4 w-4 mr-2" />
              Test Resend Email
            </>
          )}
        </button>
        
        <button
          onClick={loadEmailTemplates}
          disabled={loading}
          className={`py-2 px-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium flex items-center justify-center transition-colors`}
        >
          <SafeIcon icon={FiSettings} className="h-4 w-4 mr-2" />
          View Email Templates
        </button>
      </div>
      
      {/* Email Templates */}
      {showTemplates && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
            <SafeIcon icon={FiSettings} className="h-4 w-4 mr-1" />
            Email Templates
          </h3>
          {emailTemplates.length > 0 ? (
            <div className="space-y-3">
              {emailTemplates.map((template, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">{template.template_name}</h4>
                    <span className="text-xs text-gray-500">{template.template_name}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Subject:</strong> {template.subject}</p>
                  <details className="text-sm text-gray-600">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Template</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {template.body_template}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No email templates found.</p>
          )}
        </div>
      )}
      
      {/* Test Results */}
      {result && (
        <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className="font-medium flex items-center mb-2">
            {result.success ? (
              <>
                <SafeIcon icon={FiCheck} className="h-5 w-5 mr-2 text-green-600" />
                <span className="text-green-800">Test Successful!</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiInfo} className="h-5 w-5 mr-2 text-red-600" />
                <span className="text-red-800">Test Failed!</span>
              </>
            )}
          </h3>
          
          <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            <p><strong>Test Type:</strong> {result.type.replace('_', ' ').toUpperCase()}</p>
            {result.email && <p><strong>Email:</strong> {result.email}</p>}
            {result.otpCode && (
              <p><strong>OTP Code:</strong> 
                <span className="font-mono bg-white px-2 py-1 rounded ml-1 text-lg font-bold">{result.otpCode}</span>
              </p>
            )}
            {result.emailResult && (
              <p><strong>Email Method:</strong> {result.emailResult.method} - {result.emailResult.message}</p>
            )}
          </div>
          
          <details className="mt-3">
            <summary className={`text-sm cursor-pointer ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              View Technical Details
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-3 rounded border text-gray-700">
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {/* Help Information */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Supabase OTP Email System Guide</h4>
        <div className="space-y-1">
          <p>• <strong>Test Email System:</strong> Verifies Supabase Auth email system is working</p>
          <p>• <strong>Test Registration Email:</strong> Sends welcome email with OTP for new accounts</p>
          <p>• <strong>Test Login Email:</strong> Sends login verification email with OTP</p>
          <p>• <strong>Test Password Reset Email:</strong> Sends password reset email with OTP</p>
          <p>• <strong>Test Resend Email:</strong> Resends verification email with new OTP</p>
          <p>• <strong>View Email Templates:</strong> Shows custom email templates for each purpose</p>
          <p>• <strong>Email Targeting:</strong> Each email type has specific purpose and content</p>
          <p>• <strong>Fallback:</strong> If email fails, OTP is displayed in alert for testing</p>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;