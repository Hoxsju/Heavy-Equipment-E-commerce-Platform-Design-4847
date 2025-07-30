import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import ProfileModal from '../components/ProfileModal';
import OrderDetailModal from '../components/OrderDetailModal';
import {orderService} from '../services/orderService';
import * as FiIcons from 'react-icons/fi';

const {FiHome, FiUser, FiShoppingBag, FiEye, FiEdit, FiPackage, FiCalendar, FiMapPin, FiMessageCircle, FiShopping, FiRefreshCw} = FiIcons;

const Profile = () => {
  const {user} = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    if (user?.id || user?.email) {
      console.log('Profile: Fetching orders for user:', user.email, 'ID:', user.id);
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setLoadingOrders(true);
      console.log('Fetching orders for user:', user.email);
      
      // Try both email and ID based queries
      let ordersData = [];
      try {
        // First try by customer email
        const emailOrders = await orderService.getOrdersByCustomer(user.email);
        console.log('Orders found by email:', emailOrders?.length || 0);
        
        // Then try by customer ID if we have it
        if (user.id) {
          const idOrders = await orderService.getOrdersByCustomerId(user.id);
          console.log('Orders found by ID:', idOrders?.length || 0);
          
          // Combine and deduplicate orders
          const combinedOrders = [...(emailOrders || []), ...(idOrders || [])];
          const uniqueOrders = combinedOrders.filter((order, index, self) =>
            index === self.findIndex(o => o.id === order.id)
          );
          ordersData = uniqueOrders;
        } else {
          ordersData = emailOrders || [];
        }
        
        console.log('Final orders data:', ordersData);
        if (ordersData && ordersData.length > 0) {
          // Sort orders by updated_at first, then created_at
          ordersData.sort((a, b) => {
            const aDate = new Date(a.updated_at || a.created_at);
            const bDate = new Date(b.updated_at || b.created_at);
            return bDate - aDate;
          });
          
          setOrders(ordersData);
          
          // Calculate stats
          const pending = ordersData.filter(order => 
            ['pending', 'processing'].includes(order.status)
          ).length;
          const completed = ordersData.filter(order => 
            order.status === 'completed'
          ).length;
          
          setStats({
            totalOrders: ordersData.length,
            pendingOrders: pending,
            completedOrders: completed
          });
        } else {
          // No orders found - set empty state
          console.log('No orders found for user:', user.email);
          setOrders([]);
          setStats({
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0
          });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Set empty state on error
        setOrders([]);
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0
        });
      }
    } catch (error) {
      console.error('Error in order handling:', error);
      toast.error('Error loading your orders');
      setOrders([]);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRefreshOrders = async () => {
    setRefreshingOrders(true);
    try {
      await fetchUserOrders();
      toast.success('Orders refreshed successfully');
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast.error('Failed to refresh orders');
    } finally {
      setRefreshingOrders(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    console.log('Profile: Handling order update:', updatedOrder);
    
    // Update the order in the state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === updatedOrder.id ? {
          ...order,
          ...updatedOrder,
          updated_at: updatedOrder.updated_at || new Date().toISOString()
        } : order
      )
    );

    // Update the selected order
    setSelectedOrder(updatedOrder);
    
    // Recalculate stats
    const updatedOrders = orders.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    );
    
    const pending = updatedOrders.filter(order => 
      ['pending', 'processing'].includes(order.status)
    ).length;
    const completed = updatedOrders.filter(order => 
      order.status === 'completed'
    ).length;
    
    setStats({
      totalOrders: updatedOrders.length,
      pendingOrders: pending,
      completedOrders: completed
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Pending Quote';
    }
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(amount);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SafeIcon icon={FiUser} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
          <Link
            to="/login"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">My Account</h1>
          <div className="flex space-x-3">
            <Link
              to="/"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
            >
              <SafeIcon icon={FiHome} className="h-4 w-4 mr-2" />
              Go to Shop
            </Link>
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <SafeIcon icon={FiEdit} className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="bg-primary-100 rounded-full h-20 w-20 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
              <span className="text-primary-700 text-2xl font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600 mb-2">{user.email}</p>
              <p className="text-gray-600">{user.phone || 'No phone number provided'}</p>
              {user.address && (
                <p className="text-gray-600 mt-2 flex items-center justify-center md:justify-start">
                  <SafeIcon icon={FiMapPin} className="h-4 w-4 mr-1" />
                  {user.address}, {user.city}, {user.state} {user.zipCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <SafeIcon icon={FiShoppingBag} className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3 mr-4">
                <SafeIcon icon={FiPackage} className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <SafeIcon icon={FiPackage} className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Orders</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing orders for: {user.email}
              </p>
            </div>
            <button
              onClick={handleRefreshOrders}
              disabled={refreshingOrders}
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              <SafeIcon 
                icon={FiRefreshCw} 
                className={`h-4 w-4 mr-2 ${refreshingOrders ? 'animate-spin' : ''}`} 
              />
              {refreshingOrders ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {loadingOrders ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {order.updated_at && order.updated_at !== order.created_at ? (
                            <span className="text-blue-600 font-medium">
                              {new Date(order.updated_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">No updates</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <SafeIcon icon={FiEye} className="h-5 w-5" />
                        </button>
                        <a
                          href={`https://wa.me/966502255702?text=I'd like to inquire about my order #${order.id.slice(0, 8)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          <SafeIcon icon={FiMessageCircle} className="h-5 w-5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <SafeIcon icon={FiShoppingBag} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">When you place orders, they will appear here</p>
              <p className="text-sm text-gray-500 mb-4">
                Looking for orders? Make sure you're signed in with the correct email: <strong>{user.email}</strong>
              </p>
              <Link
                to="/"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={handleOrderUpdate}
            isAdmin={false}
          />
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;