import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiMessageCircle } = FiIcons;

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const fallbackImage = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop';

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

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <Link to={`/product/${product.id}`}>
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={product.image || fallbackImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = fallbackImage;
            }}
          />
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-2">Part #: {product.part_number}</p>
        <p className="text-sm text-gray-600 mb-4">Brand: {product.brand}</p>
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
          <span className="text-sm text-gray-600">Request Quote</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <SafeIcon icon={FiShoppingCart} className="h-4 w-4 mr-2" />
            Add to Cart
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <SafeIcon icon={FiMessageCircle} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;