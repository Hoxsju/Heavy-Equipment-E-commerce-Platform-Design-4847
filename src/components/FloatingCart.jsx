import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart } = FiIcons;

const FloatingCart = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Link 
            to="/cart" 
            className="bg-primary-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
            aria-label="View cart"
          >
            <SafeIcon icon={FiShoppingCart} className="h-6 w-6" />
            {cartCount > 0 && (
              <motion.span 
                key={cartCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
              >
                {cartCount}
              </motion.span>
            )}
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FloatingCart;