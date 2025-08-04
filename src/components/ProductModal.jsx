import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import ImageUploader from './ImageUploader';
import { storageService } from '../services/storageService';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiSave, FiPlus, FiTrash2, FiLoader, FiDownload, FiRefreshCw, FiExternalLink, FiCheck, FiAlertCircle, FiCopy, FiEye } = FiIcons;

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
  const [importingImages, setImportingImages] = useState(false);
  const [imageImportStatus, setImageImportStatus] = useState({});
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

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

  // Function to check if URL is external
  const isExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('supabase.co');
  };

  // Enhanced function to download image from external URL with better CORS handling
  const downloadImageFromUrl = async (url) => {
    try {
      console.log('Downloading image from URL:', url);
      
      // Try direct fetch first (for CORS-enabled servers)
      try {
        console.log('Attempting direct fetch...');
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'image/*,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (compatible; ImageImporter/1.0)'
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 0) {
            console.log('Direct fetch successful');
            return await createFileFromBlob(blob, url);
          }
        }
      } catch (directError) {
        console.log('Direct fetch failed:', directError.message);
      }

      // Try with different CORS proxy services
      const proxyServices = [
        // AllOrigins - most reliable
        {
          name: 'AllOrigins',
          url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          headers: {}
        },
        // Cors Anywhere (if available)
        {
          name: 'CORS Anywhere',
          url: `https://cors-anywhere.herokuapp.com/${url}`,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        },
        // Alternative proxy
        {
          name: 'Proxy Server',
          url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
          headers: {}
        }
      ];

      let lastError = null;

      for (const proxy of proxyServices) {
        try {
          console.log(`Trying ${proxy.name}...`);
          
          const response = await fetch(proxy.url, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'image/*,*/*;q=0.8',
              ...proxy.headers
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          
          // Validate blob
          if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
          }

          if (blob.size > 15 * 1024 * 1024) { // 15MB limit
            throw new Error('Downloaded file is too large (>15MB)');
          }

          console.log(`Successfully downloaded via ${proxy.name}:`, {
            size: blob.size,
            type: blob.type
          });

          return await createFileFromBlob(blob, url);

        } catch (proxyError) {
          console.error(`${proxy.name} failed:`, proxyError.message);
          lastError = proxyError;
          continue;
        }
      }

      // If all proxies failed, try a different approach - create a temporary image element
      try {
        console.log('Trying image element approach...');
        return await downloadViaImageElement(url);
      } catch (imageError) {
        console.error('Image element approach failed:', imageError);
        lastError = imageError;
      }

      throw lastError || new Error('All download methods failed');

    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  };

  // Helper function to create file from blob
  const createFileFromBlob = async (blob, originalUrl) => {
    // Determine MIME type
    let mimeType = blob.type;
    if (!mimeType || !mimeType.startsWith('image/')) {
      const urlLower = originalUrl.toLowerCase();
      if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (urlLower.includes('.png')) {
        mimeType = 'image/png';
      } else if (urlLower.includes('.webp')) {
        mimeType = 'image/webp';
      } else if (urlLower.includes('.gif')) {
        mimeType = 'image/gif';
      } else {
        mimeType = 'image/jpeg'; // Default fallback
      }
    }

    // Create filename
    const filename = originalUrl.split('/').pop()?.split('?')[0] || 'imported-image';
    const fileExtension = filename.includes('.') ? filename.split('.').pop() : 
                         mimeType.split('/')[1] || 'jpg';
    const finalFilename = filename.includes('.') ? filename : `${filename}.${fileExtension}`;

    // Create new blob with correct type if needed
    const finalBlob = blob.type !== mimeType ? new Blob([blob], { type: mimeType }) : blob;
    
    const file = new File([finalBlob], finalFilename, { type: mimeType });
    
    console.log('Created file:', {
      filename: finalFilename,
      size: file.size,
      type: file.type
    });

    return file;
  };

  // Alternative method using image element (for some CORS cases)
  const downloadViaImageElement = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create canvas to convert image to blob
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              createFileFromBlob(blob, url).then(resolve).catch(reject);
            } else {
              reject(new Error('Failed to convert image to blob'));
            }
          }, 'image/png', 0.9);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image via image element'));
      };
      
      img.src = url;
    });
  };

  // Function to import all external images
  const handleImportAllImages = async () => {
    const externalImages = formData.images.filter(isExternalUrl);
    
    if (externalImages.length === 0) {
      toast.info('No external images found to import');
      return;
    }

    setImportingImages(true);
    setImageImportStatus({});

    try {
      const importedImages = [];
      const failedImages = [];

      for (let i = 0; i < externalImages.length; i++) {
        const imageUrl = externalImages[i];
        const imageIndex = formData.images.findIndex(img => img === imageUrl);

        try {
          // Update status
          setImageImportStatus(prev => ({
            ...prev,
            [imageUrl]: { status: 'downloading', progress: 0 }
          }));

          // Download the image
          const imageFile = await downloadImageFromUrl(imageUrl);
          
          setImageImportStatus(prev => ({
            ...prev,
            [imageUrl]: { status: 'uploading', progress: 50 }
          }));

          // Upload to storage using storageService
          const uploadedUrl = await storageService.uploadProductImage(imageFile);
          
          importedImages.push({
            originalUrl: imageUrl,
            newUrl: uploadedUrl,
            index: imageIndex
          });

          setImageImportStatus(prev => ({
            ...prev,
            [imageUrl]: { status: 'success', progress: 100 }
          }));

        } catch (error) {
          console.error(`Failed to import image ${imageUrl}:`, error);
          failedImages.push({ url: imageUrl, error: error.message });
          
          setImageImportStatus(prev => ({
            ...prev,
            [imageUrl]: { 
              status: 'error', 
              progress: 100, 
              error: error.message 
            }
          }));
        }
      }

      // Update the images array with imported images
      if (importedImages.length > 0) {
        const updatedImages = [...formData.images];
        importedImages.forEach(({ originalUrl, newUrl, index }) => {
          if (index !== -1) {
            updatedImages[index] = newUrl;
          }
        });

        setFormData(prev => ({
          ...prev,
          images: updatedImages
        }));

        toast.success(
          `Successfully imported ${importedImages.length} image(s)${
            failedImages.length > 0 ? `, ${failedImages.length} failed` : ''
          }`
        );
      }

      if (failedImages.length > 0) {
        console.error('Failed images:', failedImages);
        
        // Show detailed error information
        const errorSummary = failedImages.map(({ url, error }) => 
          `${url.substring(0, 50)}...: ${error}`
        ).join('\n');
        
        toast.error(
          `Failed to import ${failedImages.length} image(s). Check console for details.`,
          { autoClose: 8000 }
        );
        
        console.group('Image Import Failures');
        failedImages.forEach(({ url, error }) => {
          console.error(`Failed to import: ${url}`);
          console.error(`Error: ${error}`);
        });
        console.groupEnd();
      }

    } catch (error) {
      console.error('Error during bulk import:', error);
      toast.error('Error during image import process');
    } finally {
      setImportingImages(false);
      // Clear status after a delay
      setTimeout(() => {
        setImageImportStatus({});
      }, 3000);
    }
  };

  // Function to import a single image
  const handleImportSingleImage = async (imageUrl, imageIndex) => {
    if (!isExternalUrl(imageUrl)) {
      toast.info('This image is already local');
      return;
    }

    setImageImportStatus(prev => ({
      ...prev,
      [imageUrl]: { status: 'downloading', progress: 0 }
    }));

    try {
      const imageFile = await downloadImageFromUrl(imageUrl);
      
      setImageImportStatus(prev => ({
        ...prev,
        [imageUrl]: { status: 'uploading', progress: 50 }
      }));

      // Upload to storage using storageService
      const uploadedUrl = await storageService.uploadProductImage(imageFile);

      // Update the specific image in the array
      const updatedImages = [...formData.images];
      updatedImages[imageIndex] = uploadedUrl;
      
      setFormData(prev => ({
        ...prev,
        images: updatedImages
      }));

      setImageImportStatus(prev => ({
        ...prev,
        [imageUrl]: { status: 'success', progress: 100 }
      }));

      toast.success('Image imported successfully!');

    } catch (error) {
      console.error(`Failed to import image:`, error);
      
      setImageImportStatus(prev => ({
        ...prev,
        [imageUrl]: { 
          status: 'error', 
          progress: 100, 
          error: error.message 
        }
      }));

      toast.error(`Failed to import image: ${error.message}`);
    }

    // Clear status after delay
    setTimeout(() => {
      setImageImportStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[imageUrl];
        return newStatus;
      });
    }, 3000);
  };

  // Function to copy URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('URL copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy URL');
    });
  };

  // Function to show image URL modal
  const showImageUrl = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setShowImageUrlModal(true);
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
        stock: formData.stock ? parseInt(formData.stock) : null,
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

  // Count external images
  const externalImageCount = formData.images.filter(isExternalUrl).length;

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

          {/* Product Images with Import Functionality */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Images
              </label>
              {externalImageCount > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-orange-600">
                    {externalImageCount} external image(s) detected
                  </span>
                  <button
                    type="button"
                    onClick={handleImportAllImages}
                    disabled={importingImages}
                    className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center text-sm"
                  >
                    {importingImages ? (
                      <>
                        <SafeIcon icon={FiLoader} className="h-4 w-4 mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiDownload} className="h-4 w-4 mr-1" />
                        Import All External Images
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Image Gallery with Import Status */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {formData.images.map((image, index) => {
                  const isExternal = isExternalUrl(image);
                  const importStatus = imageImportStatus[image];

                  return (
                    <div key={index} className="relative group">
                      <div className={`relative rounded-lg overflow-hidden border-2 ${
                        index === 0 ? 'border-primary-500' : 'border-gray-200'
                      }`}>
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop';
                          }}
                        />

                        {/* Main image badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}

                        {/* External image indicator */}
                        {isExternal && !importStatus && (
                          <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded flex items-center">
                            <SafeIcon icon={FiExternalLink} className="h-3 w-3 mr-1" />
                            External
                          </div>
                        )}

                        {/* Import status overlay */}
                        {importStatus && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-center text-white">
                              {importStatus.status === 'downloading' && (
                                <>
                                  <SafeIcon icon={FiDownload} className="h-6 w-6 mx-auto mb-1 animate-pulse" />
                                  <p className="text-xs">Downloading...</p>
                                </>
                              )}
                              {importStatus.status === 'uploading' && (
                                <>
                                  <SafeIcon icon={FiRefreshCw} className="h-6 w-6 mx-auto mb-1 animate-spin" />
                                  <p className="text-xs">Processing...</p>
                                </>
                              )}
                              {importStatus.status === 'success' && (
                                <>
                                  <SafeIcon icon={FiCheck} className="h-6 w-6 mx-auto mb-1 text-green-400" />
                                  <p className="text-xs">Imported!</p>
                                </>
                              )}
                              {importStatus.status === 'error' && (
                                <>
                                  <SafeIcon icon={FiAlertCircle} className="h-6 w-6 mx-auto mb-1 text-red-400" />
                                  <p className="text-xs">Failed</p>
                                  {importStatus.error && (
                                    <p className="text-xs mt-1 truncate max-w-24">{importStatus.error}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex space-x-2">
                            {/* Show URL button */}
                            <button
                              type="button"
                              onClick={() => showImageUrl(image)}
                              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                              title="View image URL"
                            >
                              <SafeIcon icon={FiEye} className="h-4 w-4" />
                            </button>
                            
                            {/* Copy URL button */}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(image)}
                              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                              title="Copy image URL"
                            >
                              <SafeIcon icon={FiCopy} className="h-4 w-4" />
                            </button>

                            {isExternal && !importStatus && (
                              <button
                                type="button"
                                onClick={() => handleImportSingleImage(image, index)}
                                className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700"
                                title="Import this image locally"
                              >
                                <SafeIcon icon={FiDownload} className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedImages = formData.images.filter((_, i) => i !== index);
                                setFormData(prev => ({
                                  ...prev,
                                  images: updatedImages
                                }));
                              }}
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                              title="Remove image"
                            >
                              <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image Import Info */}
            {externalImageCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <SafeIcon icon={FiExternalLink} className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-900">External Images Detected</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      You have {externalImageCount} external image(s). Importing them locally will:
                    </p>
                    <ul className="text-sm text-orange-700 mt-2 list-disc list-inside">
                      <li>Improve website loading speed</li>
                      <li>Ensure images are always available</li>
                      <li>Reduce dependency on external servers</li>
                      <li>Better SEO and performance scores</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <ImageUploader
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
              disabled={saving || importingImages}
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

        {/* Image URL Modal */}
        {showImageUrlModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Image URL</h3>
                <button
                  onClick={() => setShowImageUrlModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <img
                    src={selectedImageUrl}
                    alt="Preview"
                    className="max-w-full max-h-48 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop';
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={selectedImageUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg rounded-r-none bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedImageUrl)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg rounded-l-none hover:bg-primary-700 flex items-center"
                    >
                      <SafeIcon icon={FiCopy} className="h-4 w-4 mr-2" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isExternalUrl(selectedImageUrl) 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isExternalUrl(selectedImageUrl) ? 'External URL' : 'Local/Supabase URL'}
                  </span>
                  
                  <button
                    onClick={() => window.open(selectedImageUrl, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <SafeIcon icon={FiExternalLink} className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProductModal;