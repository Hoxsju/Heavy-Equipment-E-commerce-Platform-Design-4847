import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import { settingsService } from '../services/settingsService';
import { productService } from '../services/productService';
import * as FiIcons from 'react-icons/fi';

const { FiPhone, FiMail, FiMapPin } = FiIcons;

const Footer = () => {
  const [settings, setSettings] = useState(null);
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchSettings();
    fetchBrands();

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
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      // Get all brands without limiting to 4
      const brandsData = await productService.getBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching brands for footer:', error);
    }
  };

  // Improved brand click handler
  const handleBrandClick = (brand, e) => {
    e.preventDefault();
    
    // Force an immediate scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'  // Use 'auto' for immediate scrolling
    });
    
    // Navigate after scrolling
    setTimeout(() => {
      navigate(`/?brand=${encodeURIComponent(brand)}`);
      
      // Add multiple additional scroll attempts with increasing delays
      setTimeout(() => window.scrollTo(0, 0), 0);
      setTimeout(() => window.scrollTo(0, 0), 100);
      setTimeout(() => window.scrollTo(0, 0), 300);
    }, 0);
  };

  // Default values
  const companyName = settings?.companyName || 'HeavyParts';
  const description = settings?.footerDescription || 'Your trusted source for heavy equipment spare parts from leading brands.';
  const phone = settings?.footerPhone || '+1 (555) 123-4567';
  const email = settings?.footerEmail || 'info@heavyparts.com';
  const address = settings?.footerAddress || '123 Industrial Ave, City, State';

  return (
    <footer className="bg-gray-900 text-white w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">{companyName}</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base">{description}</p>
            <div className="flex space-x-4">
              <a href={`tel:${phone}`} className="text-gray-400 hover:text-white">
                <SafeIcon icon={FiPhone} className="h-5 w-5" />
              </a>
              <a href={`mailto:${email}`} className="text-gray-400 hover:text-white">
                <SafeIcon icon={FiMail} className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm md:text-base">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/brands" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Brands
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Brands</h4>
            <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                {brands.length > 0 ? (
                  brands.map((brand, index) => (
                    <li key={index}>
                      <a
                        href={`/#/?brand=${encodeURIComponent(brand)}`}
                        className="text-gray-400 hover:text-white text-left cursor-pointer transition-colors w-full text-left block"
                        onClick={(e) => handleBrandClick(brand, e)}
                      >
                        {brand}
                      </a>
                    </li>
                  ))
                ) : (
                  <li>Loading brands...</li>
                )}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-gray-400 text-sm md:text-base">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiPhone} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-all">{phone}</span>
              </div>
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiMail} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-all">{email}</span>
              </div>
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiMapPin} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-sm md:text-base">
            &copy; {currentYear} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;