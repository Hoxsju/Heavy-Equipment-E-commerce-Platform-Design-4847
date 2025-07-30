import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { orderService } from '../services/orderService';
import emailJSService from '../services/emailJSService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiSend, FiCheck, FiInfo, FiSettings, FiAlertCircle } = FiIcons;

const EmailJSTest = ({ embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [configStatus, setConfigStatus] = useState(null);

  const checkConfiguration = () => {
    const status = emailJSService.validateConfiguration();
    setConfigStatus(status);
    return status;
  };

  const testEmailJSConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing EmailJS connection...');
      
      // First check configuration
      const config = checkConfiguration();
      if (!config.isValid) {
        throw new Error(`Configuration issues: ${config.issues.join(', ')}`);
      }

      const testResult = await orderService.testEmailJS(testEmail || 'test@example.com');
      
      setResult({
        success: testResult.success,
        data: testResult,
        type: 'connection_test'
      });

      if (testResult.success) {
        toast.success('EmailJS test email sent successfully!');
      } else {
        toast.error(`EmailJS test failed: ${testResult.error}`);
      }

    } catch (error) {
      console.error('EmailJS test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'connection_test'
      });
      toast.error(`EmailJS test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testOrderUpdateEmail = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Testing order update email...');

      // Create mock order data for testing
      const mockOrderData = {
        id: '12345678-1234-1234-1234-123456789012',
        customer_name: 'Test Customer',
        customer_email: testEmail,
        status: 'processing',
        total_price: 1250.00,
        items: [
          {
            id: 'item1',
            name: 'Heavy Duty Bearing',
            part_number: 'HD-B-1234',
            quantity: 2
          },
          {
            id: 'item2',
            name: 'Hydraulic Cylinder',
            part_number: 'HC-5678',
            quantity: 1
          }
        ],
        delivery_address: '123 Test Street, Test City, Test State 12345',
        delivery_date: '2024-02-15',
        notes: 'This is a test order update email',
        updated_at: new Date().toISOString()
      };

      const emailResult = await emailJSService.sendOrderUpdateEmail(mockOrderData);

      setResult({
        success: emailResult.success,
        data: emailResult,
        type: 'order_update_test',
        mockData: mockOrderData
      });

      if (emailResult.success) {
        toast.success('Order update email sent successfully!');
      } else {
        toast.error(`Order update email failed: ${emailResult.error}`);
      }

    } catch (error) {
      console.error('Order update email test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'order_update_test'
      });
      toast.error(`Order update email test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testOrderConfirmationEmail = async () => {
    if (!testEmail.trim()) {
      toast.warning('Please enter an email address for testing');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Testing order confirmation email...');

      // Create mock order data for testing
      const mockOrderData = {
        id: '87654321-4321-4321-4321-210987654321',
        customer_name: 'Test Customer',
        customer_email: testEmail,
        items: [
          {
            id: 'item1',
            name: 'Engine Filter',
            part_number: 'EF-9876',
            quantity: 3
          },
          {
            id: 'item2',
            name: 'Oil Pump',
            part_number: 'OP-5432',
            quantity: 1
          }
        ],
        delivery_address: '456 Confirmation Ave, Test City, Test State 54321',
        delivery_date: '2024-02-20',
        notes: 'This is a test order confirmation email',
        created_at: new Date().toISOString()
      };

      const emailResult = await emailJSService.sendOrderConfirmationEmail(mockOrderData);

      setResult({
        success: emailResult.success,
        data: emailResult,
        type: 'order_confirmation_test',
        mockData: mockOrderData
      });

      if (emailResult.success) {
        toast.success('Order confirmation email sent successfully!');
      } else {
        toast.error(`Order confirmation email failed: ${emailResult.error}`);
      }

    } catch (error) {
      console.error('Order confirmation email test failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        type: 'order_confirmation_test'
      });
      toast.error(`Order confirmation email test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  const containerClass = embedded 
    ? "bg-white rounded-lg shadow-sm p-6" 
    : "max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md";

  return (
    <div className={containerClass}>
      <div className="flex items-center mb-4">
        <SafeIcon icon={FiMail} className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">EmailJS Service Testing</h2>
      </div>

      {/* Configuration Status */}
      {configStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          configStatus.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <SafeIcon 
              icon={configStatus.isValid ? FiCheck : FiAlertCircle} 
              className={`h-4 w-4 mr-1 ${
                configStatus.isValid ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            EmailJS Configuration Status
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Service ID:</strong> {configStatus.configuration.serviceId}</p>
            <p><strong>Template ID:</strong> {configStatus.configuration.templateId}</p>
            <p><strong>Public Key:</strong> {configStatus.configuration.publicKey}</p>
            <p><strong>Initialization:</strong> {configStatus.configuration.initialized}</p>
          </div>
          {!configStatus.isValid && configStatus.issues.length > 0 && (
            <div className="mt-2 text-sm text-red-700">
              <p><strong>Issues:</strong></p>
              <ul className="list-disc list-inside">
                {configStatus.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test Email Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <SafeIcon icon={FiMail} className="inline h-4 w-4 mr-1" />
          Test Email Address
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Enter email for testing"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter an email address where you want to receive test emails
        </p>
      </div>

      {/* EmailJS Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <SafeIcon icon={FiInfo} className="h-4 w-4 mr-1" />
          EmailJS Configuration
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>📧 <strong>Service:</strong> EmailJS (service_alhajhasan)</p>
          <p>📝 <strong>Template:</strong> template_alhajhasan</p>
          <p>🔑 <strong>Public Key:</strong> gAmpnYoqIq4cgZJ3Z</p>
          <p>🎯 <strong>Purpose:</strong> Order confirmations and updates</p>
          <p>⚡ <strong>Delivery:</strong> Real-time email sending</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={testEmailJSConnection}
          disabled={loading || !configStatus?.isValid}
          className={`py-2 px-4 rounded-lg ${
            loading || !configStatus?.isValid
              ? 'bg-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'connection_test' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiSettings} className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </button>

        <button
          onClick={testOrderUpdateEmail}
          disabled={loading || !testEmail.trim() || !configStatus?.isValid}
          className={`py-2 px-4 rounded-lg ${
            loading || !testEmail.trim() || !configStatus?.isValid
              ? 'bg-gray-400' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'order_update_test' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiSend} className="h-4 w-4 mr-2" />
              Test Update Email
            </>
          )}
        </button>

        <button
          onClick={testOrderConfirmationEmail}
          disabled={loading || !testEmail.trim() || !configStatus?.isValid}
          className={`py-2 px-4 rounded-lg ${
            loading || !testEmail.trim() || !configStatus?.isValid
              ? 'bg-gray-400' 
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white font-medium flex items-center justify-center transition-colors`}
        >
          {loading && result?.type === 'order_confirmation_test' ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
              Testing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiMail} className="h-4 w-4 mr-2" />
              Test Confirmation Email
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-medium flex items-center mb-2">
            {result.success ? (
              <>
                <SafeIcon icon={FiCheck} className="h-5 w-5 mr-2 text-green-600" />
                <span className="text-green-800">Test Successful!</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiAlertCircle} className="h-5 w-5 mr-2 text-red-600" />
                <span className="text-red-800">Test Failed!</span>
              </>
            )}
          </h3>

          <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            <p><strong>Test Type:</strong> {result.type.replace('_', ' ').toUpperCase()}</p>
            
            {result.data?.testEmail && (
              <p><strong>Test Email:</strong> {result.data.testEmail}</p>
            )}
            
            {result.data?.emailService && (
              <p><strong>Email Service:</strong> {result.data.emailService}</p>
            )}
            
            {result.data?.message && (
              <p><strong>Result:</strong> {result.data.message}</p>
            )}

            {result.mockData && (
              <div className="mt-2">
                <p><strong>Mock Order ID:</strong> #{result.mockData.id.slice(0, 8)}</p>
                <p><strong>Items:</strong> {result.mockData.items.length} items</p>
              </div>
            )}
          </div>

          <details className="mt-3">
            <summary className={`text-sm cursor-pointer ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}>
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
        <h4 className="font-medium text-gray-700 mb-2">EmailJS Integration Guide</h4>
        <div className="space-y-1">
          <p>• <strong>Test Connection:</strong> Verifies EmailJS service configuration and connectivity</p>
          <p>• <strong>Test Update Email:</strong> Sends a mock order update notification email</p>
          <p>• <strong>Test Confirmation Email:</strong> Sends a mock order confirmation email</p>
          <p>• <strong>Real-time Delivery:</strong> Emails are sent immediately when orders are updated</p>
          <p>• <strong>Template Variables:</strong> Uses dynamic content based on order data</p>
          <p>• <strong>Error Handling:</strong> Graceful fallbacks if email sending fails</p>
        </div>
      </div>
    </div>
  );
};

export default EmailJSTest;