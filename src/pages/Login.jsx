import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEye, FiEyeOff, FiInfo, FiMail } = FiIcons;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if passed from registration
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User is already logged in:', user);
      // Redirect based on user role
      if (user.role === 'main_admin' || user.role === 'admin') {
        console.log('Redirecting admin to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Redirecting user to /profile');
        navigate('/profile', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process...');
      const response = await login(formData.email, formData.password);
      console.log('Login response:', response);

      // Check if email needs confirmation
      if (response.needsConfirmation) {
        toast.info('Please verify your email address to continue.');
        navigate('/confirm-email', {
          state: {
            email: formData.email,
            message: 'Please check your email for the verification code.'
          }
        });
        return;
      }

      toast.success('Login successful!');
      
      // Redirect based on user role
      if (response.user.role === 'main_admin' || response.user.role === 'admin') {
        console.log('Redirecting admin user to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Redirecting regular user to /profile');
        navigate('/profile', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle specific error cases
      switch(error.message) {
        case 'USER_NOT_FOUND':
          toast.error('No account found with this email address.');
          break;
        case 'INVALID_CREDENTIALS':
          toast.error('Invalid email or password.');
          break;
        case 'VERIFICATION_EMAIL_FAILED':
          toast.error('Failed to send verification email. Please try again.');
          break;
        default:
          toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type) => {
    setLoading(true);
    try {
      console.log(`Starting ${type} demo login...`);
      const credentials = type === 'admin' 
        ? { email: 'admin@demo.com', password: 'admin123' }
        : { email: 'demo@demo.com', password: 'demo123' };

      const response = await login(credentials.email, credentials.password);
      console.log('Demo login response:', response);
      
      toast.success('Demo login successful!');
      
      // Redirect based on user role
      if (response.user.role === 'main_admin' || response.user.role === 'admin') {
        console.log('Redirecting demo admin to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Redirecting demo user to /profile');
        navigate('/profile', { replace: true });
      }
    } catch (error) {
      console.error('Demo login error:', error);
      toast.error('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Demo Login Options */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-blue-900">Demo Accounts</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Admin Demo (admin@demo.com)
            </button>
            <button
              onClick={() => handleDemoLogin('user')}
              disabled={loading}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
            >
              User Demo (demo@demo.com)
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            For your account ({formData.email}), you can use any password or try the demo accounts above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;