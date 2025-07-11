import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiUser, FiMail, FiMapPin, FiCalendar, FiPackage } = FiIcons;

const QuickOrderModal = ({ product, quantity, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(user ? 'order' : 'auth');
  const [orderData, setOrderData] = useState({
    quantity: quantity,
    deliveryDate: '',
    deliveryAddress: '',
    notes: ''
  });
  const [customerData, setCustomerData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleOrderDataChange = (e) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomerDataChange = (e) => {
    setCustomerData({
      ...customerData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate order submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderDetails = {
        product: product,
        quantity: orderData.quantity,
        deliveryDate: orderData.deliveryDate,
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        customer: customerData,
        total: product.price * orderData.quantity
      };

      // In a real app, this would be sent to the backend
      console.log('Order submitted:', orderDetails);
      
      toast.success('Order submitted successfully! We will contact you soon.');
      onClose();
    } catch (error) {
      toast.error('Error submitting order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <SafeIcon icon={FiX} className="h-6 w-6" />
          </button>
        </div>

        {/* Product Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">Part #: {product.partNumber}</p>
              <p className="text-sm text-gray-600">Brand: {product.brand}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600">${product.price?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {step === 'auth' && !user && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Sign in to your account for faster checkout, or continue as guest.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleSignIn}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setStep('order')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'order' && (
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SafeIcon icon={FiPackage} className="inline h-4 w-4 mr-1" />
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={orderData.quantity}
                    onChange={handleOrderDataChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SafeIcon icon={FiCalendar} className="inline h-4 w-4 mr-1" />
                    Desired Delivery Date
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={orderData.deliveryDate}
                    onChange={handleOrderDataChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SafeIcon icon={FiMapPin} className="inline h-4 w-4 mr-1" />
                  Delivery Address
                </label>
                <textarea
                  name="deliveryAddress"
                  value={orderData.deliveryAddress}
                  onChange={handleOrderDataChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter complete delivery address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={orderData.notes}
                  onChange={handleOrderDataChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special instructions or requirements"
                />
              </div>
            </div>

            {/* Customer Information */}
            {!user && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <SafeIcon icon={FiUser} className="inline h-4 w-4 mr-1" />
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerData.firstName}
                      onChange={handleCustomerDataChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerData.lastName}
                      onChange={handleCustomerDataChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <SafeIcon icon={FiMail} className="inline h-4 w-4 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerData.email}
                      onChange={handleCustomerDataChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerData.phone}
                      onChange={handleCustomerDataChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
              <div className="flex justify-between items-center">
                <span>Subtotal ({orderData.quantity} × ${product.price?.toFixed(2)}):</span>
                <span className="font-bold text-primary-600">
                  ${(product.price * orderData.quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Final pricing and shipping costs will be confirmed via email.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default QuickOrderModal;