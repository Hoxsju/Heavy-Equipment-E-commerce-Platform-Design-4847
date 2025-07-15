import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPhone, FiMail, FiMapPin } = FiIcons;

const Footer = () => {
  const [settings, setSettings] = useState(null);
  const currentYear = new Date().getFullYear(); // Get current year dynamically

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
      console.error('Error fetching footer settings:', error);
    }
  };

  // Default values
  const companyName = settings?.companyName || 'HeavyParts';
  const description = settings?.footerDescription || 'Your trusted source for heavy equipment spare parts from leading brands.';
  const phone = settings?.footerPhone || '+1 (555) 123-4567';
  const email = settings?.footerEmail || 'info@heavyparts.com';
  const address = settings?.footerAddress || '123 Industrial Ave, City, State';

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{companyName}</h3>
            <p className="text-gray-400 mb-4">{description}</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <SafeIcon icon={FiPhone} className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <SafeIcon icon={FiMail} className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-gray-400 hover:text-white">
                  Brands
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Brands</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Caterpillar</li>
              <li>Komatsu</li>
              <li>BOMAG</li>
              <li>John Deere</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiPhone} className="h-4 w-4" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMail} className="h-4 w-4" />
                <span>{email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMapPin} className="h-4 w-4" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;