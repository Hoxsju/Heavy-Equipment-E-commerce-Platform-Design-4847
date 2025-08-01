import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiMessageCircle, FiShare2, FiLoader } = FiIcons;

const ProductCard = ({ product, isVisible = true, batchIndex = 0 }) => {
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const cardRef = useRef(null);
  const fallbackImage = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop';

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add a small delay based on batch index to stagger loading
            const delay = batchIndex * 100;
            setTimeout(() => {
              setShouldLoadImage(true);
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the element comes into view
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVisible, batchIndex]);

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
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url)
        .then(() => alert('Product link copied to clipboard!'))
        .catch(err => console.log('Failed to copy link:', err));
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // Still set to true to show the fallback
  };

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.3, delay: batchIndex * 0.05 }}
    >
      <Link to={`/product/${product.id}`} className="block flex-shrink-0">
        <div className="relative w-full h-32 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
          {/* Image Loading Placeholder */}
          {!imageLoaded && shouldLoadImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center">
                <SafeIcon icon={FiLoader} className="h-6 w-6 text-gray-400 animate-spin mb-2" />
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            </div>
          )}

          {/* Skeleton placeholder when not yet loading */}
          {!shouldLoadImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}

          {/* Actual Image */}
          {shouldLoadImage && (
            <img
              src={imageError ? fallbackImage : (product.image || fallbackImage)}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              style={{
                position: imageLoaded ? 'static' : 'absolute',
                top: imageLoaded ? 'auto' : 0,
                left: imageLoaded ? 'auto' : 0
              }}
            />
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

export default ProductCard;