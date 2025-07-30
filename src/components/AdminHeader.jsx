import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import ProfileModal from './ProfileModal';
import * as FiIcons from 'react-icons/fi';

const { FiBell, FiUser, FiLogOut, FiHome } = FiIcons;

const AdminHeader = React.memo(() => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Memoize user name to prevent unnecessary re-renders
  const userName = useMemo(() => {
    return user?.firstName || 'Admin';
  }, [user?.firstName]);
  
  // Memoize role display
  const userRole = useMemo(() => {
    return user?.role?.replace('_', ' ') || '';
  }, [user?.role]);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userName}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Home Link */}
          <Link to="/" className="p-2 text-gray-400 hover:text-gray-600 flex items-center">
            <SafeIcon icon={FiHome} className="h-5 w-5 mr-1" />
            <span className="hidden md:inline">Return to Store</span>
          </Link>

          <button className="p-2 text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiBell} className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={() => setShowProfileModal(true)}
            >
              <SafeIcon icon={FiUser} className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>

            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600">
              <SafeIcon icon={FiLogOut} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </header>
  );
});

export default AdminHeader;