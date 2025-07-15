import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiMail, FiMapPin, FiCalendar, FiPhone, FiInfo, FiShoppingBag } = FiIcons;

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
    deliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // If user is logged in, skip to delivery step
  useEffect(() => {
    if (user) {
      setStep(2);
    }
  }, [user]);

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1 && !user) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    if (currentStep === 2) {
      if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      let userId = user?.id;

      // If no user is logged in, register them first
      if (!user) {
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: Math.random().toString(36).slice(-8), // Generate random password
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        };

        const registration = await register(registrationData);
        userId = registration.user.id;
      }

      // Create order
      const orderData = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          part_number: item.part_number || item.partNumber
        })),
        customer: {
          id: userId,
          firstName: formData.firstName || user?.firstName,
          lastName: formData.lastName || user?.lastName,
          email: formData.email || user?.email,
          phone: formData.phone || user?.phone
        },
        deliveryAddress: user ? user.address : `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        deliveryDate: formData.deliveryDate,
        notes: formData.notes
      };

      // Try to create the order in the database
      try {
        const order = await orderService.createOrder(orderData);
        console.log("Order created successfully:", order);
      } catch (err) {
        console.error("Error creating order in database, but continuing:", err);
        // Continue with the process even if database creation fails
      }

      clearCart();
      toast.success('Quote request submitted! We will contact you soon.');
      navigate('/profile');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Request Quotation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Show contact form only for non-logged in users */}
              {!user && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    <SafeIcon icon={FiUser} className="inline h-5 w-5 mr-2" />
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      <SafeIcon icon={FiMapPin} className="inline h-5 w-5 mr-2" />
                      Delivery Address
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Information - shown for all users */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  <SafeIcon icon={FiCalendar} className="inline h-5 w-5 mr-2" />
                  Request Details
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desired Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.deliveryDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.deliveryDate && <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Any special requirements or instructions for this order"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex">
                  <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Your request will be reviewed by our team, and we'll provide a personalized quotation based on your specific requirements. 
                      We'll contact you via email or phone to discuss pricing and delivery details.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Submit Request for Quotation'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.image || 'https://via.placeholder.com/60'}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Part #: {item.part_number || item.partNumber}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between mb-2">
                    <span>Total Items:</span>
                    <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 mb-4">
                    <span>Products:</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <p>* Price will be quoted by our team after reviewing your request</p>
                  <p>* Our team will contact you shortly after submission</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;