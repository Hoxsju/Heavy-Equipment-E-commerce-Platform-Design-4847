import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import OptimizedImageUploader from './OptimizedImageUploader';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiSave, FiPlus, FiTrash2, FiLoader } = FiIcons;

const ProductModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    brands: [],
    categories: [],
    price: '',
    salePrice: '',
    stock: '',
    description: '',
    images: [],
    status: 'draft',
    slug: ''
  });
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      // Convert single brand/category to arrays if needed
      const brands = Array.isArray(product.brands) ? product.brands : product.brand ? [product.brand] : [];
      const categories = Array.isArray(product.categories) ? product.categories : product.category ? [product.category] : [];
      
      // Convert single image to array if needed
      const images = Array.isArray(product.images) ? product.images : [];
      
      // Add main image if it exists and not already in images array
      if (product.image && !images.includes(product.image)) {
        images.unshift(product.image); // Add as first image (main image)
      }

      setFormData({
        name: product.name || '',
        partNumber: product.part_number || product.partNumber || '',
        brands: brands,
        categories: categories,
        price: product.price !== null && product.price !== undefined ? product.price.toString() : '',
        salePrice: product.sale_price !== null && product.sale_price !== undefined ? product.sale_price.toString() : '',
        stock: product.stock !== null && product.stock !== undefined ? product.stock.toString() : '',
        description: product.description || '',
        images: images,
        status: product.status || 'draft',
        slug: product.slug || ''
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        partNumber: '',
        brands: [],
        categories: [],
        price: '',
        salePrice: '',
        stock: '',
        description: '',
        images: [],
        status: 'draft',
        slug: ''
      });
    }
    
    // Clear any previous errors
    setErrors({});
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }

    // Validate numeric fields
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }

    if (formData.salePrice && isNaN(parseFloat(formData.salePrice))) {
      newErrors.salePrice = 'Sale price must be a valid number';
    }

    if (formData.stock && isNaN(parseInt(formData.stock))) {
      newErrors.stock = 'Stock must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-generate slug from name if slug field is empty
    if (name === 'name' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleAddBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData(prev => ({
        ...prev,
        brands: [...prev.brands, newBrand.trim()]
      }));
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (brand) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter(b => b !== brand)
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const handleImagesUpdate = (newImages) => {
    console.log('Images updated in modal:', newImages);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);
    try {
      console.log('Submitting product form with data:', formData);

      // Prepare data for saving with proper data types
      const productData = {
        ...formData,
        // Use first brand as the main brand for backward compatibility
        brand: formData.brands.length > 0 ? formData.brands[0] : '',
        // Use first category as the main category for backward compatibility
        category: formData.categories.length > 0 ? formData.categories[0] : '',
        // Use first image as the main image for backward compatibility
        image: formData.images.length > 0 ? formData.images[0] : '',
        // Ensure mainImage is set to the first image
        mainImage: formData.images.length > 0 ? formData.images[0] : '',
        // Convert price fields to proper types
        price: formData.price ? parseFloat(formData.price) : null,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stock: formData.stock ? parseInt(formData.stock) : null
      };

      console.log('Final product data being saved:', productData);

      const result = await onSave(productData);
      console.log('Save result:', result);
      
      toast.success(`Product ${product ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Provide more specific error messages
      let errorMessage = `Failed to ${product ? 'update' : 'create'} product`;
      
      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'A product with this part number already exists';
        } else if (error.message.includes('not null') || error.message.includes('required')) {
          errorMessage = 'Please fill in all required fields';
        } else if (error.message.includes('invalid input') || error.message.includes('invalid type')) {
          errorMessage = 'Please check your input values';
        } else if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = 'You do not have permission to perform this action';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <SafeIcon icon={FiX} className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Number *
              </label>
              <input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border ${
                  errors.partNumber ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="Enter part number"
              />
              {errors.partNumber && <p className="mt-1 text-sm text-red-600">{errors.partNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="product-url-slug"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to auto-generate from product name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Brands Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brands
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.brands.map((brand, index) => (
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
                placeholder="Add brand"
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

          {/* Categories Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.categories.map((category, index) => (
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
                placeholder="Add category"
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

          {/* Product Images - Using Optimized Uploader */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images (Optimized)
            </label>
            <OptimizedImageUploader
              images={formData.images}
              onImagesUpdate={handleImagesUpdate}
              maxImages={10}
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (Optional)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price (Optional)
              </label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${
                  errors.salePrice ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="0.00"
              />
              {errors.salePrice && <p className="mt-1 text-sm text-red-600">{errors.salePrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock (Optional)
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="0"
              />
              {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter product description"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <SafeIcon icon={FiLoader} className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
                  Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;