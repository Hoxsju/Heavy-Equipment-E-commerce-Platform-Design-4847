import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import { settingsService } from '../services/settingsService';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiGrid } = FiIcons;

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Memoize cartCount to prevent unnecessary re-renders
  const cartCount = useMemo(() => getCartCount(), [getCartCount]);
  
  // Extract isAdmin check to a separate effect to reduce re-renders
  useEffect(() => {
    if (user) {
      const adminRoles = ['admin', 'main_admin', 'sub_admin'];
      setIsAdmin(adminRoles.includes(user.role));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Memoize fetchSettings function to prevent recreation on each render
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Header: Fetching settings...');
      const settingsData = await settingsService.getSettings();
      console.log('Header: Settings loaded:', settingsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Header: Error fetching settings:', error);
      // Set default settings on error
      setSettings({
        websiteName: 'HeavyParts',
        companyName: 'AL HAJ HASSAN UNITED CO',
        websiteLogo: ''
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      console.log('Settings updated event received:', e.detail);
      setSettings(e.detail);
    };

    // Listen for user role changes
    const handleUserRoleChange = (e) => {
      console.log('User role changed event received:', e.detail);
      // We don't need to force a re-render here, the Auth context will update the user object
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    window.addEventListener('userRoleChanged', handleUserRoleChange);
    window.addEventListener('userRoleUpdated', handleUserRoleChange);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      window.removeEventListener('userRoleChanged', handleUserRoleChange);
      window.removeEventListener('userRoleUpdated', handleUserRoleChange);
    };
  }, [fetchSettings]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Function to get shortened name for mobile - memoized to prevent recalculation
  const getShortenedName = useCallback((fullName) => {
    if (fullName === 'AL HAJ HASSAN UNITED CO') {
      return 'ALHAJ HASAN UN.';
    }
    // For other long names, truncate if needed
    if (fullName && fullName.length > 15) {
      return fullName.substring(0, 12) + '...';
    }
    return fullName;
  }, []);

  // Show loading state briefly
  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 animate-pulse h-8 w-8 rounded-lg"></div>
              <div className="bg-gray-200 animate-pulse h-6 w-32 rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 animate-pulse h-6 w-6 rounded"></div>
              <div className="bg-gray-200 animate-pulse h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Use websiteName first, then companyName as fallback
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
                  console.log('Logo failed to load:', logoUrl);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : (
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <SafeIcon icon={FiMenu} className="h-6 w-6" />
              </div>
            )}
            
            {/* Fallback icon if image fails to load */}
            {logoUrl && (
              <div 
                className="bg-primary-600 text-white p-2 rounded-lg" 
                style={{display: 'none'}}
              >
                <SafeIcon icon={FiMenu} className="h-6 w-6" />
              </div>
            )}

            {/* Website name with responsive display and font size */}
            <div className="font-bold text-gray-900">
              {/* Full name for desktop and tablet */}
              <span className="hidden sm:inline text-xl">{websiteName}</span>
              {/* Shortened name for mobile with smaller font size */}
              <span className="sm:hidden text-sm">{getShortenedName(websiteName)}</span>
            </div>
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
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2">
                {/* Show dashboard for admins */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-primary-600 flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiGrid} className="h-6 w-6" />
                    <span className="text-sm hidden sm:inline">Dashboard</span>
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
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
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

// Use React.memo to prevent unnecessary re-renders
export default React.memo(Header);