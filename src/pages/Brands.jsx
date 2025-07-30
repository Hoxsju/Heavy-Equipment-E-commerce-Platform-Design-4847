import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { productService } from '../services/productService';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiExternalLink, FiPackage } = FiIcons;

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Real brand images from your uploads
  const brandImages = {
    'BOMAG': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512839679-BOMAG-logo.png',
    'CAT': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512850383-caterpillar%20%28CAT%29-logo.png',
    'Caterpillar': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512850383-caterpillar%20%28CAT%29-logo.png',
    'DYNAPAC': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512857014-dynapac-fayat-logo.png',
    'FAYAT': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512857014-dynapac-fayat-logo.png',
    'VOGELE': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512864502-VOGELE-logo.png',
    'Wirtigen': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753512870056-Wirtigen-logo.png',
    'Alhajhasan': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753514136614-Alhaj-hasan-co-icon-logo.png',
    'Road Roller': 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1753514143074-Road-Roller-Logo.png'
  };

  // Brand descriptions with real information
  const brandDescriptions = {
    'BOMAG': 'BOMAG specializes in machines for soil, asphalt, and refuse compaction, as well as stabilizers/recyclers, milling machines, and pavers.',
    'CAT': 'A leading manufacturer of construction and mining equipment, diesel and natural gas engines, industrial turbines and diesel-electric locomotives.',
    'Caterpillar': 'A leading manufacturer of construction and mining equipment, diesel and natural gas engines, industrial turbines and diesel-electric locomotives.',
    'DYNAPAC': 'DYNAPAC is a leading manufacturer of compaction and paving equipment, providing solutions for road construction and maintenance.',
    'FAYAT': 'FAYAT Group is a global leader in road construction equipment, offering comprehensive solutions for infrastructure development.',
    'VOGELE': 'VÖGELE is a leading manufacturer of road pavers and paving equipment, known for innovative technology and reliable performance.',
    'Wirtigen': 'Wirtigen is a specialist in cold milling machines, recyclers, slipform pavers, and surface miners for road construction.',
    'Alhajhasan': 'AL HAJ HASSAN UNITED CO is a trusted distributor of premium heavy equipment parts, specializing in genuine components for construction and industrial machinery.',
    'Road Roller': 'Road Roller specializes in high-quality compaction equipment for road construction, offering reliable solutions for asphalt and soil compaction projects.'
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (brands.length > 0) {
      filterBrands();
    }
  }, [brands, searchTerm]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Get brands from the API
      const brandsData = await productService.getBrands();

      // Create a brand mapping for normalization
      const brandMappings = {
        'CAT': 'Caterpillar',
        'Vogele': 'VOGELE',
        'Bomag': 'BOMAG',
        'Dynapac': 'DYNAPAC'
      };

      // Normalize brand names
      let normalizedBrands = [];
      brandsData.forEach(brand => {
        // Use the normalized brand name if it exists in the mapping
        const normalizedBrand = brandMappings[brand] || brand;
        // Add to normalized brands if it doesn't already exist
        if (!normalizedBrands.includes(normalizedBrand)) {
          normalizedBrands.push(normalizedBrand);
        }
      });

      // Add our additional brands if they don't already exist in the API data
      if (!normalizedBrands.includes('Alhajhasan')) {
        normalizedBrands.push('Alhajhasan');
      }
      if (!normalizedBrands.includes('Road Roller')) {
        normalizedBrands.push('Road Roller');
      }

      // Filter to only include brands with images
      const brandsWithLogos = normalizedBrands.filter(brand => brandImages[brand]);

      // Sort brands alphabetically
      brandsWithLogos.sort((a, b) => a.localeCompare(b));

      setBrands(brandsWithLogos);
      setFilteredBrands(brandsWithLogos);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Fallback to known brands with logos
      const fallbackBrands = Object.keys(brandImages);
      setBrands(fallbackBrands);
      setFilteredBrands(fallbackBrands);
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
    if (!searchTerm) {
      setFilteredBrands(brands);
      return;
    }

    const filtered = brands.filter(brand => 
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  // Get random product count for each brand (for demo purposes)
  const getProductCount = (brand) => {
    // Use a deterministic approach based on the brand name
    const sum = brand.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 10 + (sum % 90); // Between 10 and 99 products
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Banner */}
      <div className="bg-primary-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              Our Brands
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8">
              Discover genuine parts from leading heavy equipment manufacturers
            </p>
            {/* Search Bar */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand, index) => (
              <motion.div
                key={brand}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col h-full">
                  <div className="w-full h-48 bg-gray-50 flex items-center justify-center p-4">
                    <img
                      src={brandImages[brand]}
                      alt={brand}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.src = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop&q=${50 + index}`;
                      }}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{brand}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {brandDescriptions[brand] || `Quality ${brand} parts for heavy equipment and machinery.`}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {getProductCount(brand)} products
                      </span>
                      <Link
                        to={`/?brand=${encodeURIComponent(brand)}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
                      >
                        View Products
                        <SafeIcon icon={FiExternalLink} className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiPackage} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any brands matching your search.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Show all brands
            </button>
          </div>
        )}
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gray-50 py-8 md:py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">
              Why Choose Our Brand Partners
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              We partner with industry-leading manufacturers to ensure you get the highest quality parts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Genuine Parts</h3>
              <p className="text-gray-600">
                All parts are sourced directly from manufacturers or authorized distributors
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Extensive inventory with quick shipping and efficient global logistics
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">
                Technical assistance and advice from industry specialists
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;