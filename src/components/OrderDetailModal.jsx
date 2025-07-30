import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {toast} from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import {useAuth} from '../context/AuthContext';
import {orderService} from '../services/orderService';
import * as FiIcons from 'react-icons/fi';

const {FiX, FiCalendar, FiMapPin, FiMessageCircle, FiDollarSign, FiSave, FiEdit, FiRefreshCw, FiMail} = FiIcons;

const OrderDetailModal = ({order, onClose, onUpdate, isAdmin = false}) => {
  const {user} = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [updatedOrder, setUpdatedOrder] = useState({
    ...order,
    item_prices: order.item_prices || order.items.map(item => ({id: item.id, price: 0})),
    total_price: order.total_price || 0,
    status: order.status || 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Update local state when order prop changes
  useEffect(() => {
    console.log('Order prop changed:', order);
    setUpdatedOrder({
      ...order,
      item_prices: order.item_prices || order.items.map(item => ({id: item.id, price: 0})),
      total_price: order.total_price || 0,
      status: order.status || 'pending'
    });
  }, [order]);

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

  const handleItemPriceChange = (itemId, price) => {
    const numericPrice = parseFloat(price) || 0;
    
    // Update the item price in the item_prices array
    const updatedItemPrices = updatedOrder.item_prices.map(item =>
      item.id === itemId ? {...item, price: numericPrice} : item
    );
    
    // If the item doesn't exist in the array, add it
    if (!updatedItemPrices.some(item => item.id === itemId)) {
      updatedItemPrices.push({id: itemId, price: numericPrice});
    }
    
    // Calculate the total price
    const total = updatedItemPrices.reduce((sum, item) => {
      const orderItem = updatedOrder.items.find(i => i.id === item.id);
      const quantity = orderItem ? orderItem.quantity : 1;
      return sum + (item.price * quantity);
    }, 0);

    setUpdatedOrder({
      ...updatedOrder,
      item_prices: updatedItemPrices,
      total_price: total
    });
  };

  const handleStatusChange = (status) => {
    setUpdatedOrder({
      ...updatedOrder,
      status
    });
  };

  const handleRefreshOrder = async () => {
    if (!order.id) return;
    
    setRefreshing(true);
    try {
      console.log('Refreshing order data for:', order.id);
      const refreshedOrder = await orderService.getOrderById(order.id);
      console.log('Refreshed order data:', refreshedOrder);
      
      if (refreshedOrder) {
        // Update local state with refreshed data
        setUpdatedOrder({
          ...refreshedOrder,
          item_prices: refreshedOrder.item_prices || refreshedOrder.items.map(item => ({id: item.id, price: 0})),
          total_price: refreshedOrder.total_price || 0,
          status: refreshedOrder.status || 'pending'
        });
        
        // Notify parent component of the update
        if (onUpdate) {
          onUpdate(refreshedOrder);
        }
        
        toast.success('Order data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
      toast.error('Failed to refresh order data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!updatedOrder || !updatedOrder.customer_email) {
      toast.error('Cannot send notification: Missing customer email');
      return;
    }
    
    setSendingEmail(true);
    try {
      const result = await orderService.sendOrderUpdateNotification(updatedOrder);
      
      if (result.success) {
        toast.success('Order update notification sent to customer');
      } else {
        toast.error(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      console.log('Saving order changes...', {
        orderId: order.id,
        updates: {
          status: updatedOrder.status,
          item_prices: updatedOrder.item_prices,
          total_price: updatedOrder.total_price
        }
      });

      // Save the updated order to the database
      const result = await orderService.updateOrder(order.id, {
        status: updatedOrder.status,
        item_prices: updatedOrder.item_prices,
        total_price: updatedOrder.total_price
      });

      if (result.success) {
        console.log('Order update successful:', result.data);
        
        // Update the local state with the returned data
        const savedOrder = result.data || {
          ...order,
          status: updatedOrder.status,
          item_prices: updatedOrder.item_prices,
          total_price: updatedOrder.total_price,
          updated_at: new Date().toISOString()
        };
        
        setUpdatedOrder(savedOrder);
        
        // Call the onUpdate callback to refresh the orders list
        if (onUpdate) {
          onUpdate(savedOrder);
        }
        
        toast.success('Order updated successfully');
        setIsEditing(false);
        
        // Show confirmation that email notification will be sent
        toast.info('Email notification will be sent to the customer', {
          autoClose: 5000
        });
      } else {
        throw new Error('Update failed - no success status returned');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (itemId) => {
    const itemPrice = updatedOrder.item_prices.find(ip => ip.id === itemId);
    return itemPrice ? itemPrice.price : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8)}
          </h2>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <>
                <button
                  onClick={handleRefreshOrder}
                  disabled={refreshing}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                  title="Refresh order data"
                >
                  <SafeIcon 
                    icon={FiRefreshCw} 
                    className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} 
                  />
                </button>
                
                {!isEditing && (
                  <button
                    onClick={handleSendNotification}
                    disabled={sendingEmail}
                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                    title="Send notification email"
                  >
                    <SafeIcon 
                      icon={FiMail} 
                      className={`h-5 w-5 ${sendingEmail ? 'animate-spin' : ''}`} 
                    />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <SafeIcon icon={FiX} className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiCalendar} className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </span>
              {order.updated_at && order.updated_at !== order.created_at && (
                <span className="text-sm text-blue-600">
                  (Updated: {new Date(order.updated_at).toLocaleDateString()})
                </span>
              )}
            </div>
            {isAdmin && isEditing ? (
              <select
                value={updatedOrder.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(updatedOrder.status)}`}>
                {updatedOrder.status}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiMapPin} className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-gray-600">{order.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 mt-3">
                <SafeIcon icon={FiCalendar} className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Date</p>
                  <p className="text-gray-600">{new Date(order.delivery_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part #</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    {(updatedOrder.item_prices?.length > 0 || isAdmin) && (
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    )}
                    {(updatedOrder.item_prices?.length > 0 || isAdmin) && (
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items && order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.part_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      {(updatedOrder.item_prices?.length > 0 || isAdmin) && (
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {isAdmin && isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={getItemPrice(item.id)}
                              onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          ) : (
                            formatCurrency(getItemPrice(item.id))
                          )}
                        </td>
                      )}
                      {(updatedOrder.item_prices?.length > 0 || isAdmin) && (
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(getItemPrice(item.id) * item.quantity)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {(updatedOrder.item_prices?.length > 0 || isAdmin) && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={isAdmin && isEditing ? 3 : 3} className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(updatedOrder.total_price)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">{order.notes}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
            
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <SafeIcon icon={FiEdit} className="h-4 w-4 mr-2" />
                Edit Order
              </button>
            )}
            
            {isAdmin && isEditing && (
              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            )}
            
            {!isAdmin && (
              <a
                href={`https://wa.me/966502255702?text=I'd like to inquire about my order #${order.id.slice(0, 8)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <SafeIcon icon={FiMessageCircle} className="h-4 w-4 mr-2" />
                Contact via WhatsApp
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailModal;