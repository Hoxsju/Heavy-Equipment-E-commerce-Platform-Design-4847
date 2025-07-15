import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiGrid } = FiIcons;

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
    
    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      // Get settings from localStorage
      const localSettings = localStorage.getItem('heavyparts_settings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const websiteName = settings?.websiteName || settings?.companyName || 'HeavyParts';
  const logoUrl = settings?.websiteLogo;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={websiteName}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : (
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <SafeIcon icon={FiMenu} className="h-6 w-6" />
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">{websiteName}</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link to="/brands" className="text-gray-700 hover:text-primary-600 transition-colors">
              Brands
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <SafeIcon icon={FiShoppingCart} className="h-6 w-6 text-gray-700 hover:text-primary-600" />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2">
                {/* Show dashboard for admins */}
                {(user.role === 'admin' || user.role === 'main_admin') && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 flex items-center space-x-1">
                    <SafeIcon icon={FiGrid} className="h-6 w-6" />
                    <span className="text-sm">Dashboard</span>
                  </Link>
                )}
                
                <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                  <SafeIcon icon={FiUser} className="h-6 w-6" />
                </Link>
                
                <button onClick={handleLogout} className="text-gray-700 hover:text-primary-600">
                  <SafeIcon icon={FiLogOut} className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;