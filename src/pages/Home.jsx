import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import { productService } from '../services/productService';
import { settingsService } from '../services/settingsService';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingBag, FiFilter, FiMessageCircle, FiX, FiTruck, FiPlus, FiUpload, FiChevronDown, FiLoader } = FiIcons;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('random');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settings, setSettings] = useState(null);

  // Batch loading states
  const [visibleBatches, setVisibleBatches] = useState(1);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(12); // Default batch size

  // Get URL parameters
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Mobile-optimized responsive grid configuration
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Mobile-optimized grid configuration
  const gridConfig = {
    desktop: { columns: 4, rows: 3 }, // 4 columns x 3 rows = 12 products
    tablet: { columns: 3, rows: 4 },  // 3 columns x 4 rows = 12 products
    mobile: { columns: 2, rows: 6 }   // 2 columns x 6 rows = 12 products
  };

  // Calculate batch size based on current screen size
  const getBatchSize = () => {
    if (windowWidth >= 1024) {
      return gridConfig.desktop.columns * gridConfig.desktop.rows;
    } else if (windowWidth >= 768) {
      return gridConfig.tablet.columns * gridConfig.tablet.rows;
    } else {
      return gridConfig.mobile.columns * gridConfig.mobile.rows;
    }
  };

  // Update batch size when window resizes
  useEffect(() => {
    const newBatchSize = getBatchSize();
    setBatchSize(newBatchSize);
  }, [windowWidth]);

  // Calculate visible products based on batches
  const getVisibleProducts = () => {
    const totalToShow = visibleBatches * batchSize;
    return filteredProducts.slice(0, totalToShow);
  };

  // Get products for current batch (for loading animation)
  const getCurrentBatchProducts = () => {
    const startIndex = (visibleBatches - 1) * batchSize;
    const endIndex = visibleBatches * batchSize;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Function to shuffle array randomly
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to distribute products ensuring no category repeats more than twice in a row
  const distributeProductsWithCategoryLimit = (products, maxConsecutive = 2) => {
    if (products.length <= maxConsecutive) {
      return shuffleArray(products);
    }

    // Group products by category
    const productsByCategory = {};
    products.forEach(product => {
      const category = product.category || 'Other';
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(product);
    });

    // Shuffle products within each category
    Object.keys(productsByCategory).forEach(category => {
      productsByCategory[category] = shuffleArray(productsByCategory[category]);
    });

    // Get all categories and shuffle them
    const categories = shuffleArray(Object.keys(productsByCategory));
    const result = [];
    const categoryQueues = {};

    // Initialize category queues
    categories.forEach(category => {
      categoryQueues[category] = [...productsByCategory[category]];
    });

    let consecutiveCount = 0;
    let lastCategory = null;

    while (result.length < products.length) {
      let selectedCategory = null;
      let availableCategories = categories.filter(cat => categoryQueues[cat].length > 0);

      if (availableCategories.length === 0) break;

      // If we haven't reached the consecutive limit, we can continue with the same category
      if (lastCategory && consecutiveCount < maxConsecutive && categoryQueues[lastCategory]?.length > 0) {
        // Randomly decide whether to continue with same category or switch (70% chance to switch for better distribution)
        if (Math.random() > 0.3) {
          availableCategories = availableCategories.filter(cat => cat !== lastCategory);
        }
      }

      // If we've reached the consecutive limit, we must switch categories
      if (consecutiveCount >= maxConsecutive) {
        availableCategories = availableCategories.filter(cat => cat !== lastCategory);
      }

      // If no other categories available, reset and use any available category
      if (availableCategories.length === 0) {
        availableCategories = categories.filter(cat => categoryQueues[cat].length > 0);
      }

      // Select a random category from available ones
      if (availableCategories.length > 0) {
        selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];

        // Add product from selected category
        if (categoryQueues[selectedCategory].length > 0) {
          const product = categoryQueues[selectedCategory].shift();
          result.push(product);

          // Update consecutive tracking
          if (selectedCategory === lastCategory) {
            consecutiveCount++;
          } else {
            consecutiveCount = 1;
            lastCategory = selectedCategory;
          }
        }
      }
    }

    return result;
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSortBy('random');
    setSortOrder('asc');
    setSelectedProducts([]);
    setVisibleBatches(1); // Reset to first batch
  };

  useEffect(() => {
    // Scroll to top when component mounts
    const forceScrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };

    forceScrollToTop();
    setTimeout(forceScrollToTop, 0);
    setTimeout(forceScrollToTop, 100);

    fetchProducts();
    fetchFilters();
    fetchSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      console.log('Home: Settings updated event received:', e.detail);
      setSettings(e.detail);
      setWhatsappNumber(e.detail.whatsappNumber || '+966502255702');
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    // Add optimized window resize listener for mobile
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth);
      }
    };

    // Throttle resize events for better performance
    let resizeTimer;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Handle URL parameters when component mounts or URL changes
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      console.log('Brand parameter found in URL:', brandParam);
      setSelectedBrand(decodeURIComponent(brandParam));
      setVisibleBatches(1); // Reset to first batch when filtering

      // Improved scroll to top when brand filter is applied from URL
      const forceScrollToTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      };

      forceScrollToTop();
      setTimeout(forceScrollToTop, 0);
      setTimeout(forceScrollToTop, 100);

      // Show a toast to inform user about the filter
      toast.info(`Showing products from ${decodeURIComponent(brandParam)}`);
    } else {
      // Only reset brand if there's no URL parameter and it's not already empty
      if (selectedBrand && !brandParam) {
        setSelectedBrand('');
      }
    }
  }, [searchParams, location.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        productService.getCategories(),
        productService.getBrands()
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
      setWhatsappNumber(settingsData.whatsappNumber || '+966502255702');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Enhanced filter and sort products with random distribution
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category === selectedCategory
      );
    }

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter(product =>
        product.brand === selectedBrand
      );
    }

    // Apply sorting with special handling for random
    if (sortBy === 'random') {
      // Use the special distribution function for random sorting
      filtered = distributeProductsWithCategoryLimit(filtered, 2);
    } else {
      // Apply regular sorting for other sort options
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
    }

    setFilteredProducts(filtered);
    // Reset to first batch when filters change
    setVisibleBatches(1);
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy, sortOrder]);

  const handleLoadMore = async () => {
    setBatchLoading(true);
    
    // Simulate loading time to ensure smooth experience
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setVisibleBatches(prev => prev + 1);
    setBatchLoading(false);
  };

  const handleWhatsAppBulk = () => {
    if (selectedProducts.length === 0) {
      toast.warning('Please select products first');
      return;
    }

    const productList = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      return `${product.name} - ${product.part_number}`;
    }).join('\n');

    const message = `Hi, I'm interested in the following products:\n\n${productList}\n\nPlease provide pricing and availability.`;
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const sortOptions = [
    { value: 'random', label: 'Random (Mixed Categories)' },
    { value: 'name', label: 'Name' },
    { value: 'part_number', label: 'Part Number' },
    { value: 'brand', label: 'Brand' },
    { value: 'category', label: 'Category' },
    { value: 'created_at', label: 'Date Added' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleProducts = getVisibleProducts();
  const hasMoreProducts = filteredProducts.length > visibleProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-primary-50 py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              {settings?.websiteSlogan || 'Quality Heavy Equipment Parts'}
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8">
              Find genuine parts for your heavy equipment from leading manufacturers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="mb-8">
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

        {/* Category and Brand Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {(selectedCategory || selectedBrand || searchTerm) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
            >
              <SafeIcon icon={FiX} className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mb-6 bg-primary-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-primary-700 font-medium">
              {selectedProducts.length} products selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleWhatsAppBulk}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <SafeIcon icon={FiMessageCircle} className="h-4 w-4 mr-2" />
                Request Quote via WhatsApp
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {filteredProducts.length} Products Found
              {sortBy === 'random' && !searchTerm && !selectedCategory && !selectedBrand && (
                <span className="text-sm font-normal text-gray-600 block">
                  Mixed categories for better variety
                </span>
              )}
            </h2>
            {filteredProducts.length > 0 && (
              <p className="text-sm text-gray-600">
                Showing {visibleProducts.length} of {filteredProducts.length}
              </p>
            )}
          </div>

          {visibleProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence>
                  {visibleProducts.map((product, index) => {
                    const batchIndex = Math.floor(index / batchSize);
                    const indexInBatch = index % batchSize;
                    
                    return (
                      <div key={product.id} className="relative">
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </div>
                        <ProductCard
                          product={product}
                          isVisible={batchIndex < visibleBatches}
                          batchIndex={indexInBatch}
                        />
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Load More Button */}
              {hasMoreProducts && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={batchLoading}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {batchLoading ? (
                      <>
                        <SafeIcon icon={FiLoader} className="h-5 w-5 mr-2 animate-spin" />
                        Loading Products...
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiChevronDown} className="h-5 w-5 mr-2" />
                        Load More Products ({Math.min(batchSize, filteredProducts.length - visibleProducts.length)} more)
                      </>
                    )}
                  </button>
                  
                  {batchLoading && (
                    <p className="text-sm text-gray-500 mt-2">
                      Loading batch {visibleBatches + 1}...
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <SafeIcon icon={FiShoppingBag} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse our categories
              </p>
              <button
                onClick={resetFilters}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;