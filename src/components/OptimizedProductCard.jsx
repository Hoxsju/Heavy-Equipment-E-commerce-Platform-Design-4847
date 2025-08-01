import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import { enhancedStorageService } from '../services/enhancedStorageService';
import { imageOptimizationService } from '../services/imageOptimizationService';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiMessageCircle, FiShare2 } = FiIcons;

const OptimizedProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get optimized image URLs
  const { thumbnail, fullImage } = enhancedStorageService.getOptimizedImageUrls(product);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    const message = `Hi, I'm interested in ${product.name} - ${product.part_number}. Link: ${window.location.origin}/#/product/${product.id}`;
    const whatsappUrl = `https://wa.me/966502255702?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = (e) => {
    e.preventDefault();
    const url = `${window.location.origin}/#/product/${product.id}`;
    const title = `Check out ${product.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      }).catch(error => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Product link copied to clipboard!'))
        .catch(err => console.log('Failed to copy link:', err));
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col"
    >
      <Link to={`/product/${product.id}`} className="block flex-shrink-0">
        <div className="relative w-full h-32 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="animate-pulse">
                <SafeIcon icon={FiShoppingCart} className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )}

          {/* Main image */}
          {thumbnail && !imageError && (
            <img
              src={thumbnail}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              // Add data attributes for debugging
              data-product-id={product.id}
              data-image-type="thumbnail"
            />
          )}
          
          {/* Enhanced placeholder with better styling */}
          {(imageError || !thumbnail) && imageLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center text-gray-500 p-4">
                <SafeIcon icon={FiShoppingCart} className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs font-medium mb-1">{product.brand}</p>
                <p className="text-xs mb-1">{product.category}</p>
                <p className="text-xs text-gray-400">Part #{product.part_number}</p>
                {imageError && (
                  <p className="text-xs text-red-400 mt-1">Image unavailable</p>
                )}
              </div>
            </div>
          )}

          {/* Optimization indicator */}
          {thumbnail && thumbnail.includes('supabase') && (
            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
              ⚡
            </div>
          )}

          {/* Share button positioned at bottom right of image */}
          <button
            onClick={handleShare}
            className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-blue-600 text-white p-1.5 md:p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md z-10"
          >
            <SafeIcon icon={FiShare2} className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block mb-auto">
          <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 hover:text-primary-600 transition-colors text-sm md:text-base line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
          <p className="text-gray-600 truncate">Part #: {product.part_number}</p>
          <p className="text-gray-600 truncate">Brand: {product.brand}</p>
        </div>

        <div className="flex items-center justify-between mb-2 md:mb-4 mt-2 md:mt-3">
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            In Stock
          </span>
          <span className="text-xs md:text-sm text-gray-600">Request Quote</span>
        </div>

        <div className="flex space-x-1 md:space-x-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-primary-600 text-white py-2 px-2 md:px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center text-xs md:text-sm"
          >
            <SafeIcon icon={FiShoppingCart} className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </button>
          
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white py-2 px-2 md:px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <SafeIcon icon={FiMessageCircle} className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OptimizedProductCard;