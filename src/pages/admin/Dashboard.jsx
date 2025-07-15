import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { adminService } from '../../services/adminService';
import ProfileModal from '../../components/ProfileModal';
import * as FiIcons from 'react-icons/fi';

const { FiPackage, FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiTrendingDown, FiUser, FiEdit } = FiIcons;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = React.useContext(require('../../context/AuthContext').AuthContext);

  useEffect(() => {
    // Force scroll to top when component mounts
    window.scrollTo(0, 0);

    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: 'bg-blue-500', change: '+12%' },
    { title: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-green-500', change: '+5%' },
    { title: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'bg-purple-500', change: '+8%' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue?.toLocaleString()}`, icon: FiDollarSign, color: 'bg-yellow-500', change: '+15%' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 rounded-full p-4">
              <SafeIcon icon={FiUser} className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome, {user?.firstName} {user?.lastName}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProfileModal(true)}
            className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 flex items-center"
          >
            <SafeIcon icon={FiEdit} className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-full p-3`}>
                <SafeIcon icon={card.icon} className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <SafeIcon icon={FiTrendingUp} className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">{card.change}</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {stats.recentOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${order.total}</p>
                  <p className="text-sm text-gray-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{product.sold} sold</p>
                  <p className="text-sm text-gray-600">${product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;