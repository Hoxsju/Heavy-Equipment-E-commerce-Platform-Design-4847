import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiPackage, FiUsers, FiShoppingBag, FiSettings, FiDownload, FiUser } = FiIcons;

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/products', icon: FiPackage, label: 'Products' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { path: '/admin/import', icon: FiDownload, label: 'Import Products' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-screen">
      <div className="flex items-center justify-center py-6 border-b">
        <Link to="/" className="flex items-center space-x-2 text-primary-600 font-bold text-lg">
          <SafeIcon icon={FiPackage} className="h-6 w-6" />
          <span>HeavyParts</span>
        </Link>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SafeIcon icon={item.icon} className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="mt-8 px-4">
          <Link to="/" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 border border-gray-200">
            <SafeIcon icon={FiHome} className="h-5 w-5 mr-3" />
            Back to Store
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;