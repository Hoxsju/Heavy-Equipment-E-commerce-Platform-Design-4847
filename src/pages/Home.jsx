import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import { productService } from '../services/productService';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingBag, FiFilter, FiMessageCircle, FiX, FiTruck } = FiIcons;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(false); // Default to only in-stock products
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchFilters();
    fetchSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      setSettings(e.detail);
      setWhatsappNumber(e.detail.whatsappNumber || '+966502255702');
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, selectedBrand, showOutOfStock, sortBy, sortOrder]);

  const fetchSettings = async () => {
    try {
      // Get settings from localStorage
      const localSettings = localStorage.getItem('heavyparts_settings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        setSettings(parsedSettings);
        setWhatsappNumber(parsedSettings.whatsappNumber || '+966502255702');
      } else {
        setWhatsappNumber('+966502255702'); // Default number
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setWhatsappNumber('+966502255702'); // Fallback number
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      console.log('Fetched products:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [brandsData, categoriesData] = await Promise.all([
        productService.getBrands(),
        productService.getCategories()
      ]);
      setBrands(brandsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by stock status
    if (!showOutOfStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleWhatsAppInquiry = () => {
    if (selectedProducts.length === 0) {
      toast.warning('Please select at least one product');
      return;
    }

    const selectedItems = filteredProducts.filter(product => selectedProducts.includes(product.id));
    const message = `Hi, I'm interested in the following products:\n\n${selectedItems.map(product => 
      `${product.name} (${product.part_number})\n${window.location.origin}/#/product/${product.id}`
    ).join('\n\n')}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Newest' },
    { value: 'price', label: 'Price' },
    { value: 'brand', label: 'Brand' },
    { value: 'part_number', label: 'Part Number' }
  ];

  const heroTitle = settings?.websiteSlogan || settings?.companyName || 'Quality Heavy Equipment Parts';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-primary-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Find genuine spare parts for all major brands
            </p>
            <div className="max-w-3xl mx-auto">
              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                sortOptions={sortOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiFilter} className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiShoppingBag} className="h-4 w-4 text-gray-400" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showOutOfStock} 
                  onChange={() => setShowOutOfStock(!showOutOfStock)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show out of stock items</span>
              </label>
            </div>
            
            {selectedProducts.length > 0 && (
              <button
                onClick={handleWhatsAppInquiry}
                className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <SafeIcon icon={FiMessageCircle} className="h-4 w-4 mr-2" />
                Inquire About {selectedProducts.length} {selectedProducts.length === 1 ? 'Product' : 'Products'}
              </button>
            )}
          </div>

          {/* Filter Results Info */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory && ` in "${selectedCategory}"`}
            {selectedBrand && ` from "${selectedBrand}"`}
            {!showOutOfStock && ' (in stock only)'}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleProductSelect(product.id)}
                    className={`p-2 rounded-full ${
                      selectedProducts.includes(product.id) ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'
                    } shadow-md hover:scale-105 transition-transform`}
                  >
                    {selectedProducts.includes(product.id) ? (
                      <SafeIcon icon={FiX} className="h-4 w-4" />
                    ) : (
                      <SafeIcon icon={FiMessageCircle} className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiShoppingBag} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory || selectedBrand || !showOutOfStock
                ? 'Try adjusting your search or filter criteria'
                : 'No products are currently available'}
            </p>
            {(searchTerm || selectedCategory || selectedBrand || !showOutOfStock) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setShowOutOfStock(true);
                }}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide genuine spare parts for heavy equipment with fast delivery and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiTruck} className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick shipping to your location with tracking available</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiFilter} className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Genuine Parts</h3>
              <p className="text-gray-600">Original equipment parts with manufacturer warranty</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiMessageCircle} className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">Technical assistance and advice from industry experts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;