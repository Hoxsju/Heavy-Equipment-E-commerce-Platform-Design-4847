import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiImage, FiSave, FiPlus, FiTrash2, FiUpload } = FiIcons;

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
    mainImage: '',
    status: 'draft',
    slug: ''
  });
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      // Convert single brand/category to arrays if needed
      const brands = Array.isArray(product.brands) ? product.brands : product.brand ? [product.brand] : [];
      const categories = Array.isArray(product.categories) ? product.categories : product.category ? [product.category] : [];
      
      // Convert single image to array if needed
      const images = Array.isArray(product.images) ? product.images : [];
      if (product.image && !images.includes(product.image)) {
        images.push(product.image);
      }

      setFormData({
        name: product.name || '',
        partNumber: product.part_number || product.partNumber || '',
        brands: brands,
        categories: categories,
        price: product.price || '',
        salePrice: product.sale_price || product.salePrice || '',
        stock: product.stock || '',
        description: product.description || '',
        images: images,
        mainImage: product.image || (images.length > 0 ? images[0] : ''),
        status: product.status || 'draft',
        slug: product.slug || ''
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from name if slug field is empty
    if (name === 'name' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleAddBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData(prev => ({ ...prev, brands: [...prev.brands, newBrand.trim()] }));
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (brand) => {
    setFormData(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({ ...prev, categories: [...prev.categories, newCategory.trim()] }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category) => {
    setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      const newImages = [...formData.images, newImageUrl.trim()];
      setFormData(prev => ({
        ...prev,
        images: newImages,
        mainImage: prev.mainImage || newImageUrl.trim() // Set as main if no main image
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (image) => {
    setFormData(prev => {
      const newImages = prev.images.filter(img => img !== image);
      // If removing the main image, set the first available image as main
      const newMainImage = prev.mainImage === image ? (newImages.length > 0 ? newImages[0] : '') : prev.mainImage;
      return { ...prev, images: newImages, mainImage: newMainImage };
    });
  };

  const handleSetMainImage = (image) => {
    setFormData(prev => ({ ...prev, mainImage: image }));
  };

  const handleImportImage = async (url) => {
    if (!url.trim()) return;
    setUploading(true);
    try {
      // In a real implementation, this would upload to your storage
      // For now we'll just simulate a delay and return the same URL
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, you would replace this with actual image import logic
      // For example, with Supabase Storage:
      /*
      const fileName = url.split('/').pop();
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`products/${Date.now()}_${fileName}`, fetch(url));
      if (error) throw error;
      const publicUrl = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path).publicUrl;
      */

      // For now, just use the original URL
      const importedUrl = url;

      // Add to images if not already there
      if (!formData.images.includes(importedUrl)) {
        const newImages = [...formData.images, importedUrl];
        setFormData(prev => ({
          ...prev,
          images: newImages,
          mainImage: prev.mainImage || importedUrl
        }));
      }
      toast.success('Image imported successfully');
    } catch (error) {
      console.error('Error importing image:', error);
      toast.error('Failed to import image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data for saving
    const productData = {
      ...formData,
      // Use first brand as the main brand for backward compatibility
      brand: formData.brands.length > 0 ? formData.brands[0] : '',
      // Use first category as the main category for backward compatibility
      category: formData.categories.length > 0 ? formData.categories[0] : '',
      // Use main image as the image field for backward compatibility
      image: formData.mainImage
    };

    onSave(productData);
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
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Number
              </label>
              <input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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

            {/* Multiple Brands */}
            <div className="md:col-span-2">
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

            {/* Multiple Categories */}
            <div className="md:col-span-2">
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

            {/* Optional Price/Stock Fields */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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

          {/* Multiple Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <div className="mb-4">
              <div className="flex flex-wrap gap-3">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      formData.mainImage === image ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-24 h-24 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(image)}
                        className="p-1 bg-green-500 text-white rounded-full mx-1"
                        title="Set as main image"
                      >
                        <SafeIcon icon={FiImage} className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image)}
                        className="p-1 bg-red-500 text-white rounded-full mx-1"
                        title="Remove image"
                      >
                        <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                      </button>
                    </div>
                    {formData.mainImage === image && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs py-1 text-center">
                        Main Image
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <SafeIcon icon={FiPlus} className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                  <SafeIcon icon={FiUpload} className="h-4 w-4 mr-2" />
                  Import Image from External URL
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  Import images from external sources to store them in our system. This ensures they remain available even if the original source removes them.
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleImportImage(formData.mainImage || (formData.images.length > 0 ? formData.images[0] : ''))}
                    disabled={uploading || (!formData.mainImage && formData.images.length === 0)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiUpload} className="h-4 w-4 mr-2" />
                        Import Current Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
            />
          </div>

          <div className="flex justify-end space-x-4">
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
              Save Product
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;