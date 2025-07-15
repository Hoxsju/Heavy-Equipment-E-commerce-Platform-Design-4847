import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiSave, FiPlus, FiTag, FiDollarSign, FiPackage, FiToggleLeft } = FiIcons;

const BulkEditModal = ({ selectedProducts, onSave, onClose, productCount }) => {
  const [formData, setFormData] = useState({
    brands: {
      enabled: false,
      value: [],
      action: 'add' // 'add', 'replace', 'remove'
    },
    categories: {
      enabled: false,
      value: [],
      action: 'add'
    },
    price: {
      enabled: false,
      value: ''
    },
    salePrice: {
      enabled: false,
      value: ''
    },
    stock: {
      enabled: false,
      value: ''
    },
    status: {
      enabled: false,
      value: 'published' // 'published', 'draft'
    }
  });

  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const toggleField = (field) => {
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        enabled: !formData[field].enabled
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        value
      }
    });
  };

  const handleActionChange = (field, action) => {
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        action
      }
    });
  };

  const handleAddBrand = () => {
    if (newBrand.trim() && !formData.brands.value.includes(newBrand.trim())) {
      setFormData({
        ...formData,
        brands: {
          ...formData.brands,
          value: [...formData.brands.value, newBrand.trim()]
        }
      });
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (brand) => {
    setFormData({
      ...formData,
      brands: {
        ...formData.brands,
        value: formData.brands.value.filter(b => b !== brand)
      }
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.categories.value.includes(newCategory.trim())) {
      setFormData({
        ...formData,
        categories: {
          ...formData.categories,
          value: [...formData.categories.value, newCategory.trim()]
        }
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category) => {
    setFormData({
      ...formData,
      categories: {
        ...formData.categories,
        value: formData.categories.value.filter(c => c !== category)
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate that at least one field is enabled
    const hasEnabledField = Object.values(formData).some(field => field.enabled);
    if (!hasEnabledField) {
      toast.error('Please enable at least one field to update');
      return;
    }

    // Prepare updates object with only enabled fields
    const updates = {};
    
    if (formData.price.enabled) {
      updates.price = parseFloat(formData.price.value);
    }
    
    if (formData.salePrice.enabled) {
      updates.salePrice = formData.salePrice.value ? parseFloat(formData.salePrice.value) : null;
    }
    
    if (formData.stock.enabled) {
      updates.stock = parseInt(formData.stock.value);
    }
    
    if (formData.status.enabled) {
      updates.status = formData.status.value;
    }
    
    if (formData.brands.enabled) {
      updates.brands = {
        value: formData.brands.value,
        action: formData.brands.action
      };
    }
    
    if (formData.categories.enabled) {
      updates.categories = {
        value: formData.categories.value,
        action: formData.categories.action
      };
    }

    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Edit {productCount} Products
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            Select the fields you want to update. Only the enabled fields will be modified.
            Other product data will remain unchanged.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brands Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable-brands"
                  checked={formData.brands.enabled}
                  onChange={() => toggleField('brands')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="enable-brands" className="ml-2 text-lg font-medium text-gray-900 flex items-center">
                  <SafeIcon icon={FiTag} className="h-5 w-5 mr-2" />
                  Update Brands
                </label>
              </div>
              
              {formData.brands.enabled && (
                <select
                  value={formData.brands.action}
                  onChange={(e) => handleActionChange('brands', e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="add">Add Brands</option>
                  <option value="replace">Replace All Brands</option>
                  <option value="remove">Remove Brands</option>
                </select>
              )}
            </div>
            
            {formData.brands.enabled && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.brands.value.map((brand, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{brand}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBrand(brand)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <SafeIcon icon={FiX} className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg rounded-r-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`${formData.brands.action === 'remove' ? 'Remove' : 'Add'} brand`}
                  />
                  <button
                    type="button"
                    onClick={handleAddBrand}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg rounded-l-none hover:bg-primary-700"
                  >
                    <SafeIcon icon={FiPlus} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Categories Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable-categories"
                  checked={formData.categories.enabled}
                  onChange={() => toggleField('categories')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="enable-categories" className="ml-2 text-lg font-medium text-gray-900 flex items-center">
                  <SafeIcon icon={FiTag} className="h-5 w-5 mr-2" />
                  Update Categories
                </label>
              </div>
              
              {formData.categories.enabled && (
                <select
                  value={formData.categories.action}
                  onChange={(e) => handleActionChange('categories', e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="add">Add Categories</option>
                  <option value="replace">Replace All Categories</option>
                  <option value="remove">Remove Categories</option>
                </select>
              )}
            </div>
            
            {formData.categories.enabled && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.categories.value.map((category, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{category}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <SafeIcon icon={FiX} className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg rounded-r-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`${formData.categories.action === 'remove' ? 'Remove' : 'Add'} category`}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg rounded-l-none hover:bg-primary-700"
                  >
                    <SafeIcon icon={FiPlus} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Pricing and Stock Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiDollarSign} className="h-5 w-5 mr-2" />
              Pricing & Stock
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Field */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-price"
                    checked={formData.price.enabled}
                    onChange={() => toggleField('price')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enable-price" className="ml-2 text-sm font-medium text-gray-700">
                    Update Price
                  </label>
                </div>
                
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price.value}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  disabled={!formData.price.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="Set price for all products"
                />
              </div>
              
              {/* Sale Price Field */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-sale-price"
                    checked={formData.salePrice.enabled}
                    onChange={() => toggleField('salePrice')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enable-sale-price" className="ml-2 text-sm font-medium text-gray-700">
                    Update Sale Price
                  </label>
                </div>
                
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice.value}
                  onChange={(e) => handleInputChange('salePrice', e.target.value)}
                  disabled={!formData.salePrice.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="Set sale price for all products"
                />
              </div>
              
              {/* Stock Field */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-stock"
                    checked={formData.stock.enabled}
                    onChange={() => toggleField('stock')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enable-stock" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                    <SafeIcon icon={FiPackage} className="h-4 w-4 mr-1" />
                    Update Stock
                  </label>
                </div>
                
                <input
                  type="number"
                  min="0"
                  value={formData.stock.value}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  disabled={!formData.stock.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="Set stock for all products"
                />
              </div>
              
              {/* Status Field */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-status"
                    checked={formData.status.enabled}
                    onChange={() => toggleField('status')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enable-status" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                    <SafeIcon icon={FiToggleLeft} className="h-4 w-4 mr-1" />
                    Update Status
                  </label>
                </div>
                
                <select
                  value={formData.status.value}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!formData.status.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
            >
              <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
              Apply to {productCount} Products
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BulkEditModal;